#!/bin/bash

# Run headless chrome.
nohup google-chrome \
  --headless \
  --disable-gpu \
  --remote-debugging-port=9222 'about:blank' &
