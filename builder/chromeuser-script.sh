#!/bin/bash

# Run headless chrome.
nohup google-chrome \
  --headless \
  --disable-gpu \
  --no-sandbox \
  --remote-debugging-port=9222 'about:blank' &
