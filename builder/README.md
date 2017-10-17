# Lighthouse CI backend

> Run Lighthouse in a Docker container on App Engine.

## Development

First, get yourself the [Google Cloud SDK](https://cloud.google.com/sdk/).

### Build the image

Fire up Docker, then run:

```bash
./docker_build.sh
```

### Run the container locally

Be sure Docker is running, then run:

```bash
## Run a new container
./docker_run.sh
```

### Testing / Usage

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: <YOUR_API_KEY>" \
  --data '{"format": "json", "url": "https://staging.example.com"}' \
  https://localhost:8080/ci
```

where `format` is one of `json`, `html`.

## Deploy to Google App Engine

When you're ready to deploy the app, run  `gcloud deploy` with your app id and version:

```
gcloud app deploy app.yaml --project YOUR_PROJECT_ID --version 2017-10-16
```
