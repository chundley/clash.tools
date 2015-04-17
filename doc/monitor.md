## Setup and configuration of the monitoring server in production
This document outlines the steps to set up the Zabbix montitoring server in production.


#### Set timezone to UTC
Every server in the cluster needs to be set to the same timezone:

`$ ln -sf /usr/share/zoneinfo/UTC /etc/localtime`


#### Verify the host name is siftrock-mon
Edit the hostname file, replace what's there with siftrock-mon

`$ vim /etc/hostname`

Add to hosts file

`$ vim /etc/hosts`

Make sure these entries are there

````
127.0.0.1       localhost
127.0.1.1       siftrock-mon siftrock-mon

````

Reboot the server if you made changes

`$ reboot`

**TODO - Add steps to installing and configuring Zabbix**


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