## General system admin and server health

### Low disk space
Depending on what's running on the server there are various places to check for waste.

#### Various commands to find big files

Find files bigger than 10Mb

`$ sudo find / -size +10M -ls`

List folders from root and sizes

`$ sudo du -sx /* 2>/dev/null | sort -n`

#### Removing temporary files
Be careful removing files in /tmp because they could be used by a currently running process. One option is to use tmpreaper: 

http://manpages.ubuntu.com/manpages/hardy/man8/tmpreaper.8.html

`$ sudo apt-get install tmpreaper`

Here's an example of using tmpreaper to remove any files in /tmp that haven't been accessed in more than 100 days:

`$ sudo tmpreaper 100d /tmp`

To run in test mode before running for real, use the -t option:

`$ tmpreaper -t 100d /tmp`

#### Forever (nodejs service runner)
For servers running forever the logs are created and grow over time. They are located here:

`/root/.forever/*.log`

Note if you installed forever under a different account the location will be different such as 

`/home/admin/.forever/**`

### Generate random strong password
Use openssl to create random passwords of a specific length

`openssl rand -base64 24`