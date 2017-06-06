#!/bin/bash

export DISPLAY=:1

TMP_PROFILE_DIR=$(mktemp -d -t lighthouse.XXXXXXXXXX)

/etc/init.d/dbus start
/etc/init.d/xvfb start
sleep 1s

su chromeuser /chromeuser-script_nonheadless.sh
sleep 3s

# Create directory to write reports to.
mkdir reports

node /server.js
