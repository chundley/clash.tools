## Clash.tools

### clash.tools application setup and configuration
This document outlines the process of setting up and configuring the clash.tools production and development environments.

#### Development
Getting up and running is pretty easy, assuming you have MongoDB installed and ready to go (get a copy of the database from production).

##### Clone the project
`git clone git@github.com:chundley/clash.tools.git`

##### NPM install
```
cd clash.tools
npm install
```

##### Grunt
You'll need the Grunt CLI in order to run the app locally:

`npm install -g grunt-cli`

##### Forever
`npm install -g forever`

##### Watch
Running this command will watch all code (including css) for changes and re-build when it detects a change.

`grunt watch`

##### Run the app
If everything is set up correctly, run this to fire up the app. It should be running on localhost:7997

`node .\server\`

#### Production setup
* [MongoDB servers](doc/mongodb.md)
* [App servers](doc/app.md)
* [Load balancer](doc/loadbalancer.md)

#### Production management

##### Connecting to servers
Use SSH to connect to servers at Digital Ocean. The SSH port was changed for security reasons:

`ssh admin@ip_number -p 1975`

##### Starting / re-starting the app
There is a shell script included in the /bin folder called **start-prod.sh**

Simple start:
`./bin/start-prod.sh`

Restart:
`./bin/start-prod.sh -r`

##### Secret keys
The app is installed in `/var/node/clash.tools`. One level up in `/var/node` is a file called **c-config.json**. This is where keys are stored that we don't want in source control. When the app starts it reads this file and combines secret config with standard config to allow the app to run correctly.

#### Troubleshooting
You can tail the forever log files to see what's going on in the app.

Run this command: `forever list` which shows you the app is running. You'll see something like this:

```
info:    Forever processes running
data:        uid  command         script             forever pid  id logfile                       uptime
data:    [0] f6v5 /usr/bin/nodejs clashtools-prod.js 17061   3113    /home/admin/.forever/f6v5.log 24:3:38:31.73
```

Then tail the log file listed:

`tail -f /home/admin/.forever/f6v5.log`

If/when app servers run out of disk space, it's often the forever logs that are chewing up a lot of space. They can be deleted.

```
cd ~\.forever
rm -rf *.log
```

Note that you'll usually have to re-start the app to get the forever log to start up again.

### Copyright & License
Put whatever you want here