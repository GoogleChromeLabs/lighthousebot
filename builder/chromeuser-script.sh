#!/bin/bash

# nohup google-chrome \
#   #--headless
#   --no-first-run \
#   --disable-gpu \
#   --user-data-dir=$TMP_PROFILE_DIR \
#   --remote-debugging-port=9222 'about:blank' &
nohup google-chrome --no-first-run --disable-gpu --user-data-dir=$TMP_PROFILE_DIR --remote-debugging-port=9222 'about:blank' &