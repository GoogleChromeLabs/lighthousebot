#!/bin/bash

docker run -d -p 8080:8080 --cap-add=SYS_ADMIN lighthouse_ci
