FROM node:8-slim

LABEL maintainer="Eric Bidelman <ebidel@>"

# Install utilities, Xvfb and dbus for X11
RUN apt-get update --fix-missing && apt-get -y upgrade
RUN apt-get install -y sudo xvfb dbus-x11 --no-install-recommends

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

# Copy the chrome-user script used to start Chrome as non-root
COPY chromeuser-script_nonheadless.sh /
RUN chmod +x /chromeuser-script_nonheadless.sh

# Set the entrypoint
COPY entrypoint_nonheadless.sh /
RUN chmod +x /entrypoint_nonheadless.sh

# Add a user and make it a sudo user.
RUN groupadd -r chrome && useradd -r -m -g chrome -G audio,video chrome && \
    mkdir -p /home/chrome/reports && \
    chown -R chrome:chrome /home/chrome && \
    sudo adduser chrome sudo

# Disable Lighthouse error reporting to prevent prompt.
ENV CI=true

EXPOSE 8080

ENTRYPOINT ["dumb-init", "--", "/entrypoint_nonheadless.sh"]
#ENTRYPOINT ["dumb-init", "--"]

#CMD ["/entrypoint_nonheadless.sh"]
#CMD ["/bin/bash"]
#CMD ["node", "server.js"]
