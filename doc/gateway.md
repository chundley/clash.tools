## Gateway server setup and configuration in production
This document outlines the steps to set up the Siftrock gateway in production. The first section covers the installation of the Siftrock gateway service, the second part covers Haraka - the open source SMTP server used by Siftrock t process emails.


#### Set timezone to UTC
Every server in the cluster needs to be set to the same timezone:

`$ ln -sf /usr/share/zoneinfo/UTC /etc/localtime`


#### Verify hostname is siftrock-gw
Edit the hostname file, replace what's there with siftrock-gw

`$ vim /etc/hostname`

Add to hosts file

`$ vim /etc/hosts`

Make sure the entries look like this

````
127.0.0.1       localhost
127.0.1.1       siftrock-gw siftrock-gw
````

Reboot the server if you made changes

`$ reboot`

#### Add host name for database server
Add internal host name for database server so it's not exposed to the world

`$ vim /etc/hosts`

Add this line (if the db server ip address changes, this needs to be changed)

`107.170.239.217 siftrock-db1`

#### Install NodeJS
Install NodeJS using apt-get package manager

First update apt-get repository

`$ apt-get update`

Install NodeJS and NPM

```
$ apt-get install -y nodejs
$ apt-get install -y npm
```

Add simlink for nodejs -> node

This is necessary because there is a conflict with "node" (another app) in Ubuntu 14.04

`$ ln -s /usr/bin/nodejs /usr/bin/node`

Install grunt

`$ npm install -g grunt-cli`

#### Install git
Deployments depend on checking out the release branch from github directly

Install git

`$ apt-get install -y git`

#### Install RabbitMQ
The Haraka mail server and Siftrock gateway use RabbitMQ for mail message queueing

Add RabbitMQ repository

`$ echo "deb http://www.rabbitmq.com/debian/ testing main" >> /etc/apt/sources.list`

Add RabbitMQ verification key

`$ curl http://www.rabbitmq.com/rabbitmq-signing-key-public.asc | sudo apt-key add -`

Update package manager

`$ apt-get update`

Install RabbitMQ

`$ apt-get install -y rabbitmq-server`


#### Configure RabbitMQ

Increase open file handle limit. Open the config file -

`$ vim /etc/default/rabbitmq-server`

Un-comment this line:

`ulimit -n 1024`

Enable RabbitMQ management console

`$ rabbitmq-plugins enable rabbitmq_management`

Re-start the RabbitMQ service

`$ service rabbitmq restart`

Add system user

`$ rabbitmqctl add_user siftrock '<password>'`

Set user permissions

`$ rabbitmqctl set_permissions -p / siftrock ".*" ".*" ".*"`

Set as admin

`$ rabbitmqctl set_user_tags siftrock administrator`


#### Clone the repository

Create ssh key for root

Don't set a password during key generation

`$ ssh-keygen -t rsa -C "githubemail@githubemail.com"`

Set up ssh key in github -

[Github instructions](https://github.com/settings/ssh)

Create a folder

````
$ mkdir github
$ cd github
````

Clone repo

`git clone git@github.com:chundley/siftrock-gateway.git`

Check out release branch and enable tracking to remote in case a change is needed

`$ git checkout --track -b release origin/release`

Install project dependencies

````
$ cd siftrock-gateway
$ npm install
````


#### Set up local deployment
The application has a deploy script that runs from the local box

Create the deploy folder

`$ mkdir -p /var/node/siftrock-gateway`

The app stays running using the forever library, install it:

`$ npm install -g forever`


#### Run the deployment
Deploy from the server

Navigate to the directory containing the deployment script

`$ cd /root/github/siftrock-gateway/bin`

Run the deploy

`$ ./deploy-prod.sh`

Verify there were no problems during the deploy


### Haraka Installation
Haraka is an open source smtp server. We've forked it in order to add our own configuration and code for RabbitMQ queueing of emails


#### STEP 1: Clone the Haraka project
Access to github has already been established.

````
$ cd ~/github
$ git clone git@github.com:chundley/Haraka.git
````

Check out release branch and enable tracking to remote in case a change is needed

````
$ cd Haraka
$ git checkout --track -b release origin/release
````

Install project dependencies (this is mostly so deploy works correctly)

`$ npm install`

Create folder for deploy

`$ mkdir -p /var/node/haraka`

Deploy server

````
$ cd bin
$ ./deploy-prod.sh
````


### Create startup script for services

Create a startup script

`$ vim /etc/init.d/siftrock`

Contents of the file should be -

````
#!/bin/bash

# make sure node is found
PATH=/usr/bin:/usr/local/bin

# start haraka
/var/node/haraka/bin/start-prod.sh

# start app
/var/node/siftrock-gateway/bin/start-prod.sh

# required for init.d scripts
exit 0
````

Make the OS aware -

````
$ chmod a+x /etc/init.d/siftrock
$ update-rc.d siftrock defaults
````


### Set up a swap file
Out of the box Ubuntu doesn't have a swap file. Create one just in case it's needed.

First check to see if there's already a swap file

`$ swapon -s`

Verify memory on the server

`$ free -m`

Check available space on the hard drive

`df -h`

Depending on the amount of memory in the server and projected use of the disk, best practice is to have a swap file equal to or about double the amount of memory in the server.

In this example we have 4GB of RAM and we will create a 4GB swap disk.

Create a 4GB file

`$ fallocate -l 4G /swapfile`

Change permissions on the swap file so only root can access it

`$ chmod 600 /swapfile`

Tell the system to set swap space

`$ mkswap /swapfile`

Enable the swap space

`$ swapon /swapfile`

Verify that the server has swap space

`$ swapon -s`

Can also check free again to verify

`$ free -m`

Enable the swap file to be there on reboot

`$ vim /etc/fstab`

Add this line to the bottom of the file to tell the operating system to allocate swap space on reboot

`/swapfile   none    swap    sw    0   0`

Since this is a server, we want to set "swapiness" to something low so it only uses it when necessary. Check current swapiness -

`$ cat /proc/sys/vm/swappiness`

The default is usually 60, it needs to be more like 10

Set swapiness to 10

`$ sysctl vm.swappiness=10`

Once again, this setting will not persist on reboot. To set the value permanently:

`$ vim /etc/sysctl.conf`

At the end of the file, add this line -

`vm.swappiness=10`


### Install and configure Datadog monitoring

Taken from the [Ubuntu installation instructions at Datadog](https://app.datadoghq.com/account/settings#agent/ubuntu)

#### Install the agent

`DD_API_KEY=APIKEYGOESHERE bash -c "$(curl -L https://raw.githubusercontent.com/DataDog/dd-agent/master/packaging/datadog-agent/source/install_agent.sh)"`

#### Configure Datadog

Edit the rabbitmq.yaml file and add the connection properties

`$ vim /etc/dd-agent/conf.d/rabbitmq.yaml`

The file should look like this:

````
init_config:

instances:
    -  rabbitmq_api_url: http://localhost:15672/api/
       rabbitmq_user: siftrock
       rabbitmq_pass: t6+17R}a$8
       queues:
         - siftrock
````

Restart the agent

`$ /etc/init.d/datadog-agent restart`

Rabbitmq metrics should start collecting in DataDog


### DEPRECIATED!!! Install and configure Zabbix monitoring DEPRECIATED!!!

Install the agent

`$ apt-get install -y zabbix-agent`

Update config with the zabbix server

`$ vim /etc/zabbix/zabbix_agentd.conf`

Edit the server property to reflect the Zabbix server name in production

`Server=monitor.siftrock.com`

Edit the hostname property to reflect this machine's host name

`Hostname=siftrock-gw`

Re-start the zabbix agent

`$ service zabbix-agent restart`
