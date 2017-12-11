#!/bin/bash

# Switch if you want to Lighthouse with full Chrome instead of headless.
# docker build -f Dockerfile.nonheadless -t lighthouse_ci . --build-arg CACHEBUST=$(date +%d)

docker build -t lighthouse_ci . --build-arg CACHEBUST=$(date +%d)
