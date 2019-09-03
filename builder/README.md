# Lighthouse in Docker

> Run Lighthouse in a Docker container (as a CLI or a web service)

This folder repo example Dockerfiles for running Lighthouse using [Headless Chrome](https://developers.google.com/web/updates/2017/04/headless-chrome) and full Chrome and can
be used in cloud environments like [Google App Engine Flex](https://cloud.google.com/appengine/docs/flexible/nodejs/) (Node).

Main source files:

- [`Dockerfile`](https://github.com/ebidel/lighthouse-ci/blob/master/builder/Dockerfile) - Dockerfile for running Lighthouse using headless Chrome.
- [`Dockerfile.nonheadless`](https://github.com/ebidel/lighthouse-ci/blob/master/builder/Dockerfile.nonheadless) - Dockerfile for running Lighthouse using full Chrome.
- `server.js` - The server implementation for the `/ci` endpoint. See [Using the container as a web service](#using-the-container-as-a-cli).

## Build it

Fire up Docker, then run:

```bash
yarn build
```

**Image size: ~690MB.**

## Running the container

There are two ways to run the container. One is directly from the command line.
The other option starts a server and allows you to run Lighthouse as a web service (LaaS).

### Using the container as a CLI

The container can be from the the CLI just like using the Lighthouse npm module. See 
Lighthouse docs for [CLI options](https://github.com/GoogleChrome/lighthouse#cli-options).

```bash
# Audit example.com. Lighthouse results are printed to stdout.
docker run -it --rm --cap-add=SYS_ADMIN lighthouse_ci https://example.com


# Audits example.com and saves HTML report to a file.
docker run -it --rm --cap-add=SYS_ADMIN lighthouse_ci https://example.com --quiet > report.html

# Audits example.com and saves JSON results to a file.
docker run -it --rm --cap-add=SYS_ADMIN lighthouse_ci https://example.com --quiet --output=json > report.json

# Print Lighthouse version used in the container.
docker run -it --rm --cap-add=SYS_ADMIN lighthouse_ci --version
```

### Using the container as a web service (LaaS)

The container also ships with a web service that supports a REST API. You can
use it to run Lighthouse in the cloud and return scores.

To run the web server, invoke `docker run` without any arguments:

```bash
docker run -dit -p 8080:8080 --rm --name lighthouse_ci --cap-add=SYS_ADMIN lighthouse_ci

# or 
yarn serve

# or
# handy for building + restarting the container
yarn restart
```

This starts a server on `8080` and exposes a REST endpoint at `http://localhost:8080/ci`.
By default, requests ask for an API key to help prevent abuse and associate 
requests with users. However, you don't have to use one in your own server. 
If you don't want to require keys from users, simply include the parameter but use a
fake value (e.g. "abc123").

**Examples**

`GET` requests will stream logs from Lighthouse until the report is ready. Once
ready, the page redirects to the final output:


```bash
curl http://localhost:8080/ci?key=<API_KEY>&url=https://example.com&output=html
```

The endpoint also supports `POST` requests. Instead of query params, send JSON
with the same parameter names:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: <API_KEY>" \
  --data '{"output": "json", "url": "https://example.com"}' \
  http://localhost:8080/ci
```

where `output` is `json` or `html`.

## Using full Chrome instead of headless Chrome

By default, the Dockerfile launches headless Chrome to run Lighthouse. If you
want to to use "headlful" Chrome, build the image using `Dockerfile.nonheadless`:  

```bash
docker build -f Dockerfile.nonheadless -t lighthouse_ci . --build-arg CACHEBUST=$(date +%d)
```

Everything else should remain the same.

## Deploy to Google App Engine Flex (Node)

First, get yourself the [Google Cloud SDK](https://cloud.google.com/sdk/).

When you're ready to deploy the app, run `gcloud deploy` with your app id and version:

```
gcloud app deploy app.yaml --project YOUR_PROJECT_ID --version 2017-10-16
```
