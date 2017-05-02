FROM debian:sid

LABEL name="lighthouse-ci"
LABEL maintainer="Eric Bidelman <ebidel@>"
LABEL version="1.0"
LABEL description="Lighthouse CI for testing all the perf things"

## PART 1: Core components
## =======================

# base deps
ENV deps="apt-transport-https ca-certificates curl gnupg"

# Install Xvfb and dbus for X11
# Note: Uncomment if you don't want to use Headless Chrome.
#ENV deps="$deps xvfb dbus-x11"

# Install imagemagick for tests [optional]
#ENV deps="$deps imagemagick"

# Install git for Lighthouse source install
#ENV deps="$deps git"

# Install utilities
RUN apt-get update && apt-get install -y $deps \
	--no-install-recommends \
  && curl -sSL https://deb.nodesource.com/setup_6.x | bash - \
  && curl -sSL https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
	&& echo "deb [arch=amd64] https://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
	&& apt-get update && apt-get install -y \
	google-chrome-stable \
  nodejs \
	--no-install-recommends \
  && npm --global install yarn \
	&& apt-get purge --auto-remove -y curl gnupg \
	&& rm -rf /var/lib/apt/lists/*

# Copy key documents (except .dockerignored files)
# Note: Uncomment these if you don't want to use Headless Chrome.
# COPY etc/xvfb /etc/init.d/xvfb
# RUN chmod +x /etc/init.d/xvfb

## PART 2: Lighthouse
## ==================

# Download lighthouse from source.
# RUN git clone https://github.com/googlechrome/lighthouse &&\
# cd /lighthouse &&\
# git checkout tags/1.6.5 &&\
# yarn install &&\
# yarn install-all &&\
# yarn build-all

# Download lighthouse from npm.
# cache bust so we always get the latest version of LH when building the image.
ARG CACHEBUST=1
RUN yarn global add lighthouse

## PART 3: Setup Running Env
## =========================

# Copy Express server and run scripts
COPY ["package.json", "server.js", "chromeuser-script.sh", "entrypoint.sh", "/"]

# Install express
RUN yarn install

## PART 4: Final setup
## ===================

# Add Chrome as a user
RUN groupadd -r chrome && useradd -r -g chrome -G audio,video chrome \
    && mkdir -p /home/chrome/Downloads && chown -R chrome:chrome /home/chrome

# Run Chrome non-privileged
USER chrome

# Expose port 8080
EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
