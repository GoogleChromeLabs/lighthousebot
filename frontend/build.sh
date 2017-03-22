#!/bin/sh

OAUTH_TOKEN=`cat .oauth_token`;

sed "s/___OAUTHTOKEN___/$OAUTH_TOKEN/g" app.yaml.template > app.yaml
