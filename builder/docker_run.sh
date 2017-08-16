#!/bin/bash

docker run -it -p 8085:8085 --cap-add=SYS_ADMIN lighthouse_ci
