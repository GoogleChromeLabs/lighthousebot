FROM node:10-slim

LABEL maintainer="Eric Bidelman <ebidel@>"

# Install utilities
RUN apt-get update --fix-missing && apt-get -y upgrade

# Install latest chrome dev package.
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-unstable --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /src/*.deb

ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.0/dumb-init_1.2.0_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

# Download latest Lighthouse from npm.
# cache bust so we always get the latest version of LH when building the image.
ARG CACHEBUST=1
RUN npm i lighthouse -g

# Install express.
COPY package.json .
RUN npm i --production

# Add the simple server.
COPY server.js /
RUN chmod +x /server.js

COPY entrypoint.sh /
RUN chmod +x /entrypoint.sh

# Add a chrome user and setup home dir.
RUN groupadd --system chrome && \
    useradd --system --create-home --gid chrome --groups audio,video chrome && \
    mkdir --parents /home/chrome/reports && \
    chown --recursive chrome:chrome /home/chrome

USER chrome

#VOLUME /home/chrome/reports
#WORKDIR /home/chrome/reports

# Disable Lighthouse error reporting to prevent prompt.
ENV CI=true

EXPOSE 8080

ENTRYPOINT ["dumb-init", "--", "/entrypoint.sh"]
#CMD ["lighthouse", "--help"]
