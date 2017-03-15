# Lighthouse CI

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
curl -X GET 'http://localhost:8080?format=${format}&url=${url}'
```

where `format` is one of `json`, `html`.
