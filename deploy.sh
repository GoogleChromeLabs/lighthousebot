#!/bin/sh

deployVersion=$1

if [ -z "$deployVersion" ]
then
  echo "App version not specified."
  echo "Usage: deploy.sh `date +%Y-%m-%d`"
  exit 0
fi

readonly APPDIR=$(dirname $BASH_SOURCE)

#echo "\nBuilding app version: $deployVersion\n"
#gulp

echo "Deploying frontend version: $deployVersion"
gcloud app deploy frontend/app.yaml \
    --project lighthouse-ci --version $deployVersion
    #--account ericbidelman@google.com

#echo "Deploying builder version: $deployVersion"
#gcloud app deploy builder/app.yaml \
#    --project lighthouse-ci --version $deployVersion