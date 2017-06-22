# Lighthouse CI backend

Running Lighthouse in a Docker container.

## Build the image

```bash
docker build -t lighthouse_ci .
```

## Run the container

```bash
## Run a new container
docker run -d -p 8080:8080 --cap-add=SYS_ADMIN lighthouse_ci
```

## Usage

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: <YOUR_API_KEY>" \
  --data '{"format": "json", "url": "https://staging.example.com"}' \
  https://builder-dot-lighthouse-ci.appspot.com/ci
```

where `format` is one of `json`, `html`.
