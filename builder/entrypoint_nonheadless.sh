#!/bin/sh

# Using full Chrome in Docker requires us to start xvfb and launch our own instance.

/etc/init.d/dbus start

Xvfb :99 -ac -screen 0 1280x1024x24 -nolisten tcp &
xvfb=$!
export DISPLAY=:99

TMP_PROFILE_DIR=$(mktemp -d -t lighthouse.XXXXXXXXXX)

su chrome /chromeuser-script_nonheadless.sh

if [ -z "$1" ]; then
  npm run start
else
  lighthouse --port=9222 --output-path=stdout $@
fi
