#!/bin/bash

#DIR=$(cd $(dirname "$0"); pwd)
#pushd $DIR/..

# production location of the app is hard-coded for rc0.d startup
DIR=/var/node/siftrock-app
pushd $DIR

if [ $1 = "-r" ]
then
    echo "Restarting server..."
    forever stop siftrock-app-prod.js
fi

export NODE_ENV=production

forever start siftrock-app-prod.js
