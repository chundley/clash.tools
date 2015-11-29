## General security settings for production Ubuntu 14.04 servers

### Admin user
Create the admin user to avoid having to log in as root. Use the standard admin password for this user.

`$ adduser admin`

#### Add admin user to sudo'ers
Enable the admin account to execute administrative stuff using sudo.

`$ gpasswd -a admin sudo`

Make sure you can ssh and su with this account. SSH to the server using the new credentials and make sure you have access to sudo use.

### Configure SSH
Lock down SSH to avoid common attacks. Open sshd (SSH daemon) config file:

`$ vim /etc/ssh/sshd_config`

#### Disable ssh login for root
Make sure the root user can't ssh to the box. Change this configuration to:

`PermitRootLogin no`

#### Change port
Change the port ssh runs on to prevent common intrusion attacks and probing

`port 1975`

#### Restart ssh
Restart the server

`service ssh restart`

### Harden IP security
Add settings to ignore ICMP pings and other improvements - taken from
http://blog.mattbrock.co.uk/hardening-the-security-on-ubuntu-server-14-04/

`$ sudo vim /etc/sysctl.d/10-network-security.conf`

Add this to the bottom of the file

````
# Ignore ICMP broadcast requests
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Disable source packet routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0 
net.ipv4.conf.default.accept_source_route = 0
net.ipv6.conf.default.accept_source_route = 0

# Ignore send redirects
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0

# Block SYN attacks
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_syn_retries = 5

# Log Martians
net.ipv4.conf.all.log_martians = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1

# Ignore ICMP redirects
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0 
net.ipv6.conf.default.accept_redirects = 0

# Ignore Directed pings
net.ipv4.icmp_echo_ignore_all = 1
````

Load the new rules

`$ sudo service procps start`


### Install and configure a firewall
Every server should be firewalled. The basics are always the same, but incoming ports that need to be opened are documented in the setup instructions for each server type.

#### UFW
"Uncomplicated Firewall" is just an interface to iptables. It may already be installed - check status using this command:

`$ sudo ufw status`

If it's not installed:

`$ sudo apt-get install ufw`

Configure UFW to support IPv6

`$ sudo vim /etc/default/ufw`

Make sure this line is there and uncommented:

`IPV6=yes`

Deny incoming connections on all ports by default. 

**NOTE** that settings won't be applied until ufw is enabled. Make sure and open the ports that are needed before enabling the firewall.

`$ sudo ufw default deny incoming`

Allow all outgoing connections:

`$ sudo ufw default allow outgoing`

#### Configure firewall ports
Set which ports are to be open for this server. Refer to the documentation for individual servers.

SSH port

`$ sudo ufw allow 1975/tcp`

#### Turn it on
Once all ports are configured, enable the firewall.

`sudo ufw enable`

Check the status (verbose)

`sudo ufw status verbose`

