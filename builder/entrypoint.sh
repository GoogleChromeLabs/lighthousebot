#!/bin/bash

#/etc/init.d/dbus start
#/etc/init.d/xvfb start
#sleep 1s

#export DISPLAY=:1
TMP_PROFILE_DIR=$(mktemp -d -t lighthouse.XXXXXXXXXX)

su chromeuser /chromeuser-script.sh
sleep 3s

node /server.js
