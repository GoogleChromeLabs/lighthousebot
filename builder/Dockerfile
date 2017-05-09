FROM debian:sid

LABEL name="lighthouse-ci" \
      maintainer="Eric Bidelman <ebidel@>" \
			version="1.0" \
			description="Lighthouse CI for testing all the perf things"

## PART 1: Define Core components
## =======================

# These are base dependencies; every install needs them
ENV deps="apt-transport-https ca-certificates curl gnupg"

# Note: Uncomment if you don't want to use Headless Chrome.
# Install Xvfb and dbus for X11 and copy xvfb init
#ENV deps="$deps xvfb dbus-x11"
#COPY etc/xvfb /etc/init.d/xvfb

# Install imagemagick for tests [optional]
#ENV deps="$deps imagemagick"

# Install git if you plan to build and install Lighthouse from source [optional]
#ENV deps="$deps git"

## Part 2: Install Core components 
## ===============================

# This RUN command setups our base container:
#  1. Installs our base dependencies defined in ENV $dep 
#  2. Pulls setup for Node 6.x
#  3. Pulls public key for Google and adds to our trust so we can authenticate the Chrome package
#  4. Adds a sources.list called google-chrome.list so apt knows where to get the latest Chrome
#  5. Run an apt update and install Google Chrome M59+ and Node with no-install-recommends
#  6. Run npm to install yarn
#  7. Purge some dependenices we know we no longer need (curl gnupg)
#  8. Remove our cached package lists that apt made to save space
RUN apt-get update && apt-get install -y $deps --no-install-recommends \
  && curl -sSL https://deb.nodesource.com/setup_6.x | bash - \
  && curl -sSL https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
	&& echo "deb [arch=amd64] https://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
	&& apt-get update && apt-get install -y \
		google-chrome-beta \
  	nodejs \
		--no-install-recommends \
  && npm --global install yarn \
	&& apt-get purge --auto-remove -y curl gnupg \
	&& rm -rf /var/lib/apt/lists/*

## PART 3: Install Lighthouse
## ==========================

# Note: Uncomment the following lines if you want to download and build lighthouse from source
# Remember to uncomment the "Install git" dependency in Part 1 or this step will fail 
#RUN git clone https://github.com/googlechrome/lighthouse \
#	&& cd /lighthouse \
#	&& git checkout tags/1.6.5 \
#	&& yarn install \
#	&& yarn install-all \
#	&& yarn build-all

# Download lighthouse from npm.
# cache bust so we always get the latest version of LH when building the image.
ARG CACHEBUST=1
RUN yarn global add lighthouse

## PART 4: Setup Running Env
## =========================

# Copy Express server and run scripts
COPY ["package.json", "server.js", "chromeuser-script.sh", "entrypoint.sh", "/"]

# Install Express server
RUN yarn install

## PART 5: Final setup
## ===================

# Add Chrome as a user
RUN groupadd -r lighthouseci && useradd -r -g lighthouseci -G audio,video lighthouseci \
    && mkdir -p /home/lighthouseci && chown -R lighthouseci:lighthouseci /home/lighthouseci

# Run as our recently created non-privileged user
USER lighthouseci

# Expose port 8080
EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
