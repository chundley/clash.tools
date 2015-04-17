## Setup and configuration of the load balancer in production
This document outlines the steps to set up the application load balancer in production.


#### Set timezone to UTC
Every server in the cluster needs to be set to the same timezone:

`$ ln -sf /usr/share/zoneinfo/UTC /etc/localtime`


#### Verify the host name is siftrock-lb1
Edit the hostname file, replace what's there with siftrock-lb1

`$ vim /etc/hostname`

Add to hosts file

`$ vim /etc/hosts`

Make sure these entries are there

````
127.0.0.1       localhost
127.0.1.1       siftrock-lb1 siftrock-lb1

````

Reboot the server if you made changes

`$ reboot`


#### Install ngnix
Nginx is used as the load balancer / proxy for the application servers

Update package manager

`$ apt-get update`

Install nginx

`$ apt-get install -y nginx`

Set nginx to start automatically (it is often already set this way)

`$ update-rc.d nginx defaults`


#### Add SSL certificate for app.siftrock.com to the server
There are three files needed to begin the process.

`$ mkdir /var/ssl`

Copy files to server in the above location
* siftrock.key
* siftrock.cert
* gd_bundle-g2-g1.cert

The cert files need to be combined for nginx

`cat /var/ssl/siftrock.cert /var/ssl/gd_bundle-g2-g1.cert > /var/ssl/siftrock-combined.cert`

Change permissions

`chmod 400 /var/ssl/*.*`


#### Host name configuration for app servers
Instead of publically exposing the app servers, use internal host names

`$ vim /etc/hosts`

Add these entries (note to change these if prod app servers change):

````
107.170.194.9   siftrock-app1
192.241.215.101 siftrock-app2
````


#### Configure load balancer
In this step we'll set nginx up to be a load balancer for the two app servers.

Edit nginx main config file

`$ vim /etc/nginx/nginx.conf`

Add this entry in the http {  } section:

````
http {
    upstream siftrock-app {
        server siftrock-app1:7993;
        server siftrock-app2:7993;
    }

    .
    .
    .
}
````

Create a new config file, leaving the default for reference

`$ vim /etc/nginx/sites-available/siftrock-lb`

The contents of the file:

````
# re-direct non-secure requests to secure server
server {
    listen 80;

    root /var/www/html;
    try_files /maintenance.html @secure;

    location @secure {
        rewrite ^ https://app.siftrock.com permanent;
    }
}

server {
    listen 443;
    server_name app.siftrock.com;

    # to support local maintenance page if necessary
    root /var/webroot;

    # if the maintenance page is there it will server rather than going to the app servers
    try_files /maintenance.html @proxy;

    # SSL config
    ssl on;
    ssl_certificate /var/ssl/siftrock-combined.cert;
    ssl_certificate_key /var/ssl/siftrock.key;

    # references siftrock-app which is defined in /etc/nginx/nginx.conf for load balancing
    location @proxy {
        # rewrite some headers so the app gets the correct IP from origin
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;

        # proxy requests to load balanced set defined in nginx.conf
        proxy_pass http://siftrock-app;

        # just in case the app requests a non ssl endpoint, redirect that through ssl
        proxy_redirect http://app.siftrock.com https://app.siftrock.com;
    }
}
````

Remove the existing default simlink

`$ rm -rf /etc/nginx/sites-enabled/default`

Add the new simlink

`$ ln -s /etc/nginx/sites-available/siftrock-lb /etc/nginx/sites-enabled/default`

Reload config

`$ nginx -s reload`

Assuming the app servers are running, verify the application is working and check the nginx logs for anything strange.

Access log -

`$ tail -f /var/log/nginx/access.log`

Error log -

`$ tail -f /var/log/nginx/error.log`


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

`Hostname=siftrock-lb1`

Re-start the zabbix agent

`$ service zabbix-agent restart`
