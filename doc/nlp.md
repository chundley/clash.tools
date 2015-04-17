## NLP server setup and configuration in production
This document outlines the steps to set up the Siftrock NLP server in production.


#### Set timezone to UTC
Every server in the cluster needs to be set to the same timezone:

`$ ln -sf /usr/share/zoneinfo/UTC /etc/localtime`


#### Verify hostname is siftrock-nlp

Edit the hostname file, replace what's there with siftrock-nlp

`$ vim /etc/hostname`

Add to hosts file

`$ vim /etc/hosts`

Make sure the entries look like this

````
127.0.0.1       localhost
127.0.1.1       siftrock-nlp siftrock-nlp
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


#### Install Java / JRE
This project depends on the Stanford open NLP project which runs in Java

`$ apt-get install -y default-jre`


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

`git clone git@github.com:chundley/siftrock-nlp.git`

Check out release branch and enable tracking to remote in case a change is needed

`$ git checkout --track -b release origin/release`

Install project dependencies

````
$ cd siftrock-nlp
$ npm install
````


#### Set up local deployment
The application has a deploy script that runs from the local box

Create the deploy folder

`$ mkdir -p /var/node/siftrock-nlp`

The app stays running using the forever library, install it:

`$ npm install -g forever`


#### Run the deployment
Deploy from the server

Navigate to the directory containing the deployment script

`$ cd /root/github/siftrock-nlp/bin`

Run the deploy

`$ ./deploy-prod.sh`

Verify there were no problems during the deploy


#### Create startup script for services

Create a startup script

`$ vim /etc/init.d/siftrock`

Contents of the file should be -

````
#!/bin/bash

# make sure node is found
PATH=/usr/bin:/usr/local/bin

# start app
/var/node/siftrock-nlp/bin/start-prod.sh

# required for init.d scripts
exit 0
````

Make the OS aware -

````
$ chmod a+x /etc/init.d/siftrock
$ update-rc.d siftrock defaults
````


#### Set up a swap file
Out of the box Ubuntu doesn't have a swap file. Create one just in case it's needed.

First check to see if there's already a swap file

`$ swapon -s`

Verify memory on the server

`$ free -m`

Check available space on the hard drive

`df -h`

Depending on the amount of memory in the server and projected use of the disk, best practice is to have a swap file equal to or about double the amount of memory in the server.

In this example we have 1GB of RAM and we will create a 2GB swap disk.

Create a 2GB file

`$ fallocate -l 2G /swapfile`

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


#### Install and configure Zabbix monitoring

Install the agent

`$ apt-get install -y zabbix-agent`

Update config with the zabbix server

`$ vim /etc/zabbix/zabbix_agentd.conf`

Edit the server property to reflect the Zabbix server name in production

`Server=monitor.siftrock.com`

Edit the hostname property to reflect this machine's host name

`Hostname=siftrock-nlp`

Re-start the zabbix agent

`$ service zabbix-agent restart`
