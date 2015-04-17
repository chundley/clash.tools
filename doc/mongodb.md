## MongoDB setup and configuration in production
This document outlines the steps to set up MongoDB in production.

**NOTE**: If at any time setting up the replica sets seems to not be working, start over by deleting the data in /var/lib/mongodb and restarting the mongod service on each server

### siftrock-db1
This is the primary MongoDB instance, running on Ubuntu 14.04

#### Set timezone to UTC
Every server in the cluster needs to be set to the same timezone:

`$ ln -sf /usr/share/zoneinfo/UTC /etc/localtime`


#### Change the hostname to siftrock-db1

Edit the hostname file, replace what's there with siftrock-db1

`$ vim /etc/hostname`

Edit host file and add other servers

`$ vim /etc/hosts`

Make sure this entry is there

`127.0.0.1       siftrock-db1`

Add these entries for the other servers in the cluster:

````
104.131.136.15  siftrock-db2
104.131.120.227 siftrock-db3
````

Reboot the server if you changed the hostname

`$ reboot`


#### Install MongoDB

Import public key for for package management

`$ apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10`

Create a list file for MongoDB

`$ echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | sudo tee /etc/apt/sources.list.d/mongodb.list`

Reload local package database

`$ apt-get update`

Install latest stable MongoDB package. As of 9/23/14 this is version 2.6.4

`$ apt-get install -y mongodb-org`

Start MongoDB (it may already be running)

`$ service mongod start`

Locations of common files:
* Config: /etc/mongod.conf
* Data: /var/lib/mongodb
* Log: /var/log/mongodb/mongod.log

Set MongoDB to accept connections from outside localhost

`$ vim /etc/mongod.conf`

Comment out this line:

`bind_ip = 127.0.0.1`


#### Configure MongoDB as a Replica Set

Open the config file and find the replSet setting, change to the following:

`replSet=rs0`

Restart mongodb

`$ service mongod restart`

Connect to mongodb

`$ mongo`

Initiate the replica set

`> rs.initiate()`

Verify the configuration

`> rs.conf()`

It should look like the following:

````
{
    "_id" : "rs0",
    "version" : 2,
    "members" : [
        {
            "_id" : 0,
            "host" : "siftrock-db1:27017"
        }
    ]
}
````

Verify the host name. If it is incorrect something went wrong with step 1 above. To manually set the host name, use this set of commands:

````
cfg = rs.conf()
cfg.members[0].host = "db1.siftrock.com:27017"
rs.reconfig(cfg)
````

This should now be the primary server on a new replication set

### siftrock-db2

#### Set timezone to UTC
Every server in the cluster needs to be set to the same timezone:

`$ ln -sf /usr/share/zoneinfo/UTC /etc/localtime`


#### Change the hostname to siftrock-db2

Follow step above substituting siftrock-db2 for siftrock-db1

In the hosts file, add the other servers in the cluster

````
107.170.239.217 siftrock-db1
104.131.120.227 siftrock-db3
````


#### Install MongoDB

Follow step above substituting siftrock-db2 for siftrock-db1


#### Configure MongoDB as a replica set

Open the config file and find the replSet setting, change to the following:

`replSet=rs0`

Restart mongodb

`$ service mongod restart`


#### Add this server to the replica set

Log into **siftrock-db1** and connect to MongoDB

`> rs.add("siftrock-db2:27017")`

Verify the configuration changed

`> rs.conf()`

It should look something like this:

````
{
    "_id" : "rs0",
    "version" : 3,
    "members" : [
        {
            "_id" : 0,
            "host" : "siftrock-db1:27017"
        },
        {
            "_id" : 1,
            "host" : "siftrock-db2:27017"
        }
    ]
}
````

Check the status on both servers

`> rs.status()`

It should look something like this:

````
{
    "set" : "rs0",
    "date" : ISODate("2014-09-24T01:26:55Z"),
    "myState" : 1,
    "members" : [
        {
            "_id" : 0,
            "name" : "siftrock-db1:27017",
            "health" : 1,
            "state" : 1,
            "stateStr" : "PRIMARY",
            "uptime" : 1836,
            "optime" : Timestamp(1411520361, 1),
            "optimeDate" : ISODate("2014-09-24T00:59:21Z"),
            "electionTime" : Timestamp(1411520179, 11),
            "electionDate" : ISODate("2014-09-24T00:56:19Z"),
            "self" : true
        },
        {
            "_id" : 1,
            "name" : "siftrock-db2:27017",
            "health" : 1,
            "state" : 2,
            "stateStr" : "SECONDARY",
            "uptime" : 1654,
            "optime" : Timestamp(1411520361, 1),
            "optimeDate" : ISODate("2014-09-24T00:59:21Z"),
            "lastHeartbeat" : ISODate("2014-09-24T01:26:54Z"),
            "lastHeartbeatRecv" : ISODate("2014-09-24T01:26:54Z"),
            "pingMs" : 0,
            "syncingTo" : "siftrock-db1:27017"
        }
    ],
    "ok" : 1
}
````

### siftrock-db3


#### Set timezone to UTC
Every server in the cluster needs to be set to the same timezone:

`$ ln -sf /usr/share/zoneinfo/UTC /etc/localtime`


#### Change the hostname to siftrock-db3

Follow step 1 above substituting siftrock-db3 for siftrock-db1

In the hosts file, add the other servers in the cluster

````
107.170.239.217 siftrock-db1
104.131.136.15  siftrock-db2
````


#### Install MongoDB

Follow step above substituting siftrock-db3 for siftrock-db1


#### Configure MongoDB as a replica set

Open the config file and find the replSet setting, change to the following:

`replSet=rs0`

Restart the MongoDb service

`$ service mongod restart`


#### Add this server to the replica set

Log into **siftrock-db1** and connect to MongoDB

`> rs.add("siftrock-db3:27017")`

Verify the configuration changed

`> rs.conf()`

It should look something like this:

````
{
    "_id" : "rs0",
    "version" : 3,
    "members" : [
        {
            "_id" : 0,
            "host" : "db1.siftrock.com:27017"
        },
        {
            "_id" : 1,
            "host" : "db2.siftrock.com:27017"
        },
        {
            "_id" : 2,
            "host" : "db3.siftrock.com:27017"
        }
    ]
}
````

Check the status on both servers

`> rs.status()`

It should look something like this:

````
{
    "set" : "rs0",
    "date" : ISODate("2014-09-26T15:46:31Z"),
    "myState" : 1,
    "members" : [
        {
            "_id" : 0,
            "name" : "siftrock-db1:27017",
            "health" : 1,
            "state" : 1,
            "stateStr" : "PRIMARY",
            "uptime" : 130,
            "optime" : Timestamp(1411746120, 1),
            "optimeDate" : ISODate("2014-09-26T15:42:00Z"),
            "electionTime" : Timestamp(1411746337, 1),
            "electionDate" : ISODate("2014-09-26T15:45:37Z"),
            "self" : true
        },
        {
            "_id" : 1,
            "name" : "siftrock-db2:27017",
            "health" : 1,
            "state" : 2,
            "stateStr" : "SECONDARY",
            "uptime" : 41,
            "optime" : Timestamp(1411746120, 1),
            "optimeDate" : ISODate("2014-09-26T15:42:00Z"),
            "lastHeartbeat" : ISODate("2014-09-26T15:46:30Z"),
            "lastHeartbeatRecv" : ISODate("2014-09-26T15:46:31Z"),
            "pingMs" : 0,
            "lastHeartbeatMessage" : "syncing to: siftrock-db1:27017",
            "syncingTo" : "siftrock-db1:27017"
        },
        {
            "_id" : 2,
            "name" : "siftrock-db3:27017",
            "health" : 1,
            "state" : 2,
            "stateStr" : "SECONDARY",
            "uptime" : 130,
            "optime" : Timestamp(1411746120, 1),
            "optimeDate" : ISODate("2014-09-26T15:42:00Z"),
            "lastHeartbeat" : ISODate("2014-09-26T15:46:30Z"),
            "lastHeartbeatRecv" : ISODate("2014-09-26T15:46:30Z"),
            "pingMs" : 80,
            "lastHeartbeatMessage" : "syncing to: siftrock-db1:27017",
            "syncingTo" : "siftrock-db1:27017"
        }
    ],
    "ok" : 1
}
````


#### Set priority to zero

Because this db server is in a different data center, set the priority to zero so it is not eligible to become a primary node. This server is designated for emergency only and we don't want it failing over unless it's the only one left.

Copy the replica set to a variable, set the priority, and update. Make sure you update the correct member (array position from the above rs.conf() call):

````
cfg = rs.conf()
cfg.members[2].priority = 0
rs.reconfig(cfg)
````

Verify the priority was set correctly

`> rs.conf()`

It should look like this:

````
{
    "_id" : "rs0",
    "version" : 4,
    "members" : [
        {
            "_id" : 0,
            "host" : "siftrock-db1:27017"
        },
        {
            "_id" : 1,
            "host" : "siftrock-db2:27017"
        },
        {
            "_id" : 2,
            "host" : "siftrock-db3:27017",
            "priority" : 0
        }
    ]
}
````


### MongoDB Security / Authentication

Do these steps on the primary (db1) MongoDB Server

#### Set up admin user
Set up administrator credentials. The password is not shown here for security reasons. This should be done on the primary database server.

````
use admin
db.createUser( {
    user: "admin",
    pwd: "<password>",
    roles: [ { role: "root", db: "admin" } ]
});
````


#### Set up the siftrock user

First, exit MongoDB and reconnect as admin

`$ mongo admin -u 'admin' -p '<password>'`

Set up the user who accesses the siftrock database from the app. The password is not shown here for security reasons. This should be done on the primary database server.

````
use siftrock
db.createUser( {
    user: "siftrock",
    pwd: "<password>",
    roles: [ { role: "readWrite", db: "siftrock" }, { role: "dbAdmin", db: "siftrock" }  ]
});

````


#### Create a key file to be used for authentication across the replica sets

Make a directory to hold the file

`$ mkdir /var/lib/siftrock`

Create a random file using open-ssl entropy

`openssl rand -base64 741 > mongodb-keyfile`

Change ownership so only the owner can read/write

````
$ chown mongodb:mongodb mongodb-keyfile
$ chmod 600 mongodb-keyfile
````

**Copy this file to each replica server, put it in the same location and set the same permissions**


#### Modify the config file and set auth for each server

`$ vim /etc/mongod.conf`

Find this line and un-comment it

`auth = true`

Find this line and edit as such:

`keyFile=/var/lib/siftrock/mongodb-keyfile`

Save, and restart mongodb

`service mongod restart`

Once all the servers are back up things should look good, and connections should require authentication.


### Set up a swap file
Out of the box Ubuntu doesn't have a swap file. Create one just in case it's needed.

First check to see if there's already a swap file

`$ swapon -s`

Verify memory on the server

`$ free -m`

Check available space on the hard drive

`df -h`

Depending on the amount of memory in the server and projected use of the disk, best practice is to have a swap file equal to or about double the amount of memory in the server.

In this example we have 4GB of RAM. MongoDB doesn't use a swap file so we'll keep it smaller to conserve disk space - 2GB.

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


### Install and configure Datadog monitoring (primary database server only for now)
Taken from the [Ubuntu installation instructions at Datadog](https://app.datadoghq.com/account/settings#agent/ubuntu)

#### Install the agent

`DD_API_KEY=APIKEYGOESHERE bash -c "$(curl -L https://raw.githubusercontent.com/DataDog/dd-agent/master/packaging/datadog-agent/source/install_agent.sh)"`

#### Create the mongodb user for metrics collection

Connect to mongodb as admin

`$ mongo admin -u 'admin' -p '<password>'`

Set up the datadog user with readAnyDatabase and clusterMonitor roles. The password is not shown here for security reasons. This should be done on the primary database server.

````
use admin
db.createUser( {
    user: "datadog",
    pwd: "<password>",
    roles: [ { role: "readAnyDatabase", db: "admin" }, { role: "clusterMonitor", db: "admin" }  ]
});

````

Edit the mongo.yaml file and add the connection properties

`$ vim /etc/dd-agent/conf.d/mongo.yaml`

The file should look like this:

````
init_config:

instances:
  # Specify the MongoDB URI, with database to use for reporting (defaults to "admin")
  - server: mongodb://datadog:<password>@localhost:27017/admin
    # tags:
    #   - optional_tag1
    #   - optional_tag2
````

Restart the agent

`$ /etc/init.d/datadog-agent restart`

MongoDB metrics should start collecting in DataDog


### DEPRECIATED!!! Install and configure Zabbix monitoring - DEPRECIATED!!!

Install the agent

`$ apt-get install -y zabbix-agent`

Update config with the zabbix server

`$ vim /etc/zabbix/zabbix_agentd.conf`

Edit the server property to reflect the Zabbix server name in production

`Server=monitor.siftrock.com`

Edit the hostname property to reflect this machine's host name

`Hostname=siftrock-db[n]`

Re-start the zabbix agent

`$ service zabbix-agent restart`
