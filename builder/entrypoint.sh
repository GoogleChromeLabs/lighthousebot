#!/bin/bash

# Note: Uncomment if you don't want to use Headless Chrome.
# export DISPLAY=:1

TMP_PROFILE_DIR=$(mktemp -d -t lighthouse.XXXXXXXXXX)

# Note: Uncomment if you don't want to use Headless Chrome.
# /etc/init.d/dbus start
# /etc/init.d/xvfb start
# sleep 1s

/chromeuser-script.sh
sleep 3s

node /server.js
