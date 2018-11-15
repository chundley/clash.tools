## App server setup and configuration in production
This document outlines the steps to set up the application in production.

### ct-app[n]
Each app server should be exactly the same other than host name

#### Security
Initial security setup can be found in the [general security doc here](doc/security.md). Do those steps before moving on.

Add firewall rules to support the application running on port 7997.

`$ sudo ufw allow 7997/tcp`

#### Set timezone to UTC
Every server in the cluster needs to be set to the same timezone:

`$ ln -sf /usr/share/zoneinfo/UTC /etc/localtime`


#### Verify hostname is ct-app[n]
Edit the hostname file, replace what's there with ct-app[n]

`$ vim /etc/hostname`

Add to hosts file

`$ vim /etc/hosts`

Make sure the entries look like this

````
127.0.0.1       localhost
127.0.1.1       ct-app[n] ct-app[n]
````

Reboot the server if you made changes

`$ reboot`


#### Add host name for database server
Add internal host name for database server so it's not exposed to the world

`$ vim /etc/hosts`

Add this line (if the db server ip address changes, this needs to be changed)

`107.170.222.166 ct-db1`


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

`git clone git@github.com:chundley/clash.tools.git`

Install project dependencies

````
$ cd clash.tools
$ git checkout --track -b release origin/release
$ npm install
````

#### Set up local deployment
The application has a deploy script that runs from the local box

Create the deploy folder

`$ mkdir -p /var/node/clash.tools`

The app stays running using the forever library, install it:

`$ npm install -g forever`

#### Add c-config.js
Sensitive passwords and keys are stored in a file called c-config.js. This file is required in two locations:

For the build:

`~/github/c-config.js`

For production app:

`/var/node/c-config.js`



#### Run the deployment
Deploy from the server

Navigate to the directory containing the deployment script

`$ cd ~/github/clash.tools/bin`

Run the deploy

`$ ./deploy-prod.sh`

Verify there were no problems during the deploy


#### Set the app to run on startup

Create a startup script

`$ vim ~/startup.sh`

Contents of the file should be -

````
#!/bin/bash

# make sure node is found
PATH=/usr/bin:/usr/local/bin

# start app
/var/node/clash.tools/bin/start-prod.sh
````

Make the script executable

`$ chmod 700 startup.sh`

Add to crontab to start on boot

`$ crontab -e`

Add this line

`@reboot /home/admin/startup.sh`

#### Set up a swap file
Out of the box Ubuntu doesn't have a swap file. Create one just in case it's needed.

First check to see if there's already a swap file

`$ swapon -s`

Verify memory on the server

`$ free -m`

Check available space on the hard drive

`df -h`

Depending on the amount of memory in the server and projected use of the disk, best practice is to have a swap file equal to or about double the amount of memory in the server.

In this example we have 512MB of RAM and we will create a 1GB swap disk.

Create a 1GB file

`$ fallocate -l 1G /swapfile`

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
