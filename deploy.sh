#!/bin/sh

deployVersion=$1
app=$2
usage="Usage: deploy.sh `date +%Y-%m-%d` builder|frontend "
#readonly APPDIR=$(dirname $BASH_SOURCE)

if [ -z "$deployVersion" ]
then
  echo "App version not specified."
  echo $usage
  exit 0
fi

if [ -z "$app" ]
then
  echo 'Please specify "builder" or "frontend" target to deploy.'
  echo $usage
  exit 0
fi

echo "Deploying $app version: $deployVersion"

if [ $app == "builder" ]
then
  gcloud app deploy builder/app.yaml \
      --project lighthouse-ci --version $deployVersion
elif [ $app == "frontend" ]
then
  gcloud app deploy frontend/app.yaml \
      --project lighthouse-ci --version $deployVersion
else
  echo $usage
  exit 0
fi
