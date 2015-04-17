#!/bin/bash

# app root directory
ROOT="$( cd "$( dirname "$0" )" && pwd )/../"

# deploy destination
DEST=/var/node/siftrock-app

# for detecting dependencies
app_exists() {
  if hash $1 2>/dev/null; then
    return 0
  else
    return 1
  fi
}

# escape sequences for console formatting
Green='\e[32m'  # basic green
Red='\e[31m'    # basic red
Bold='\e[1m'    # bold
Rst='\e[0m'     # reset styles

# fancy banner!
echo -e ${Green}${Bold}
echo -e "          _  __ _                  _                        "
echo -e "      ___(_)/ _| |_ _ __ ___   ___| | __   __ _ _ __  _ __  "
echo -e "     / __| | |_| __| '__/ _ \ / __| |/ /  / _\` | '_ \| '_ \ "
echo -e "     \__ \ |  _| |_| | | (_) | (__|   <  | (_| | |_) | |_) |"
echo -e "     |___/_|_|  \__|_|  \___/ \___|_|\_\  \__,_| .__/| .__/ "
echo -e "                                               |_|   |_|    \n"

# pre-requisites
#############################################################################################

# NodeJS
if (! app_exists "node")
then
  echo -e ${Red}${Bold}"\nABORT----------------------------------------\nNodeJS not found, aborting deployment\n"${Rst}
  exit 1
fi

# NPM
if (! app_exists "npm")
then
  echo -e ${Red}${Bold}"\nABORT----------------------------------------\nNPM not found, aborting deployment\n"${Rst}
  exit 1
fi

# git
if (! app_exists "git")
then
  echo -e ${Red}${Bold}"\nABORT----------------------------------------\ngit not found, aborting deployment\n"${Rst}
  exit 1
fi

# Grunt
if (! app_exists "grunt")
then
  echo -e ${Green}${Bold}"\n~~~ Deployment (siftrock-app): Intalling grunt-cli ~~~\n"${Rst}
  pushd $ROOT
  sudo npm install -g grunt-cli
  popd
fi

# Forever
if (! app_exists "forever")
then
  echo -e ${Green}${Bold}"\n~~~ Deployment (siftrock-app): Intalling forever ~~~\n"${Rst}
  pushd $ROOT
  sudo npm install -g forever
  popd
fi

# app deploy/run
#############################################################################################

# pull latest from release
echo -e ${Green}${Bold}"\n~~~ Deployment (siftrock-app): Pulling latest from github ~~~\n"${Rst}
pushd $ROOT             # get to project root
git checkout release    # check out release branch
git pull                # pull latest
popd

# build fresh from source on deploy
echo -e ${Green}${Bold}"\n~~~ Deployment (siftrock-app): Fresh build coming up ~~~\n"${Rst}
pushd $ROOT     # get to project root
grunt build     # grunt build task to create a fresh build from source
popd

# copy build to prod destination
echo -e ${Green}${Bold}"\n~~~ Deployment (siftrock-app): Pushing build to $deployRoot ~~~\n"${Rst}
pushd $DEST                              # get to destination
rm -rf $(ls | grep -v '^node_modules$')  # remove destination to ensure a clean install but leave node_modules for speed
pushd $ROOT                              # ensure we're at root of project
cp -fRuv .build/* $DEST                  # copy files from fresh build into prod destination

# update node packages
echo -e ${Green}${Bold}"\n~~~ Deployment (siftrock-app): Updating node packages ~~~\n"${Rst}
pushd $DEST     # get to dest root
npm install     # install new node packages (if  any)
popd

# database deploy script (if any)
#echo -e ${Green}${Bold}"\n~~~ Deployment (siftrock-app): DB deploy ~~~\n"${Rst}
#app_version=$(grep -Po '(?<="version": ")[^"]*' ${DEST}/package.json)
#db_deploy="${DEST}/bin/db_deploy/${app_version}.js"
#if [ -f $db_deploy ];
#then
#   echo "DB Deploy script found: $db_deploy"
#   mongo siftrock -u 'siftrock' -p 't6+17R}a$8' $db_deploy
#else
#   echo "No DB Deploy script found for version ${app_version}, skipping"
#fi

# restart service
echo -e ${Green}${Bold}"\n~~~ Deployment (siftrock-app): Restart service ~~~\n"${Rst}
pushd $DEST/bin/    # get to deploy bin directory
chmod a+x *.sh      # ensure scripts are executable
./start-prod.sh -r  # re-start production service
popd
