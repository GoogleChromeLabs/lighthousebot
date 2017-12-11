#!/bin/bash

# Run full chrome with a bunch of stuff turned off.
nohup google-chrome \
  --no-first-run \
  --disable-gpu \
  --disable-translate \
  --disable-default-apps \
  --disable-extensions \
  --disable-background-networking \
  --disable-sync \
  --metrics-recording-only \
  --safebrowsing-disable-auto-update \
  --disable-setuid-sandbox \
  --user-data-dir=${TMP_PROFILE_DIR} \
  --remote-debugging-port=9222 'about:blank' &
