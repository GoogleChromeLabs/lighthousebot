#!/bin/bash

if [ -z "$1" ]; then
  npm run start
else
  lighthouse --port=9222 --chrome-flags="--headless --no-sandbox --proxy-server=\"$HTTP_PROXY\" --proxy-bypass-list=\"$PROXY_BYPASS_LIST\"" --output-path=stdout $@
fi
