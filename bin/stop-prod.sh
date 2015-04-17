#!/bin/bash

DIR=$(cd $(dirname "$0"); pwd)

pushd $DIR/..
forever stop clashtools-prod.js
