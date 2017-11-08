# Lighthouse CI backend

> Run Lighthouse in a Docker container on App Engine.

## Development

First, get yourself the [Google Cloud SDK](https://cloud.google.com/sdk/).

### Build the image

Fire up Docker, then run:

```bash
yarn build
```

### Run the container locally

Be sure Docker is running, then start the container's web service:

```bash
yarn serve
# yarn restart is also handy for building + restarting the container.
```

### Testing / Usage

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: <YOUR_LIGHTHOUSE_API_KEY>" \
  --data '{"format": "json", "url": "https://example.com"}' \
  http://localhost:8080/ci
```

where `format` is `json` or `html`.

## Deploy to Google App Engine

When you're ready to deploy the app, run  `gcloud deploy` with your app id and version:

```
gcloud app deploy app.yaml --project YOUR_PROJECT_ID --version 2017-10-16
```
