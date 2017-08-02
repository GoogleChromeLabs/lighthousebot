# Lighthouse CI backend

Running Lighthouse in a Docker container.

## Build the image

```bash
./docker_build.sh
```

## Run the container

```bash
## Run a new container
./docker_run.sh
```

## Usage

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: <YOUR_API_KEY>" \
  --data '{"format": "json", "url": "https://staging.example.com"}' \
  https://builder-dot-lighthouse-ci.appspot.com/ci
```

```bash
curl -i \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -X GET 'https://builder-dot-lighthouse-ci.appspot.com/stream?format=json&url=https://staging.example.com'
```

where `format` is one of `json`, `html`.
