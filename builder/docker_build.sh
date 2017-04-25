#!/bin/bash

docker build -t lighthouse_ci . --build-arg CACHEBUST=$(date +%d)
