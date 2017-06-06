#!/bin/bash

# Build for Headless Chrome.
# docker build -t lighthouse_ci . --build-arg CACHEBUST=$(date +%d)

# Build for non-headless Chrome version.
docker build -f Dockerfile.nonheadless -t lighthouse_ci . --build-arg CACHEBUST=$(date +%d)
