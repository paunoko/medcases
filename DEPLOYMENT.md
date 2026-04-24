# Deployment Guide

This guide explains how to deploy MedCases using Docker and how to configure it using environment variables.

## Docker Deployment

The application is containerized using a multi-stage Dockerfile that builds both the client and the server, and serves them as a single unit.

### Prerequisites

- Docker installed on your system.

### Building the Image

To build the Docker image, run the following command in the root directory of the project. You can optionally specify the `VITE_BASE_PATH` build argument if you want to deploy the application under a subpath.

```bash
# Build for root path (default)
docker build -t medcases .

# Build for a specific subpath (e.g., /medcases)
docker build --build-arg VITE_BASE_PATH=/medcases -t medcases .
```

### Running the Container

Run the container using `docker run`. You must map the port and can optionally set environment variables.

```bash
# Basic run (accessible at http://localhost:3000)
# Logs will be natively captured by Docker (view with `docker logs -f <container_id>`)
docker run -p 3000:3000 medcases

# Run with custom base path (must match build-arg!)
docker run -p 3000:3000 -e BASE_PATH=/medcases medcases
```

#### Persisting File Logs (Volume Mapping)
If you prefer to browse flat rotating file logs instead of relying on the Docker engine logs, the server caches up to 14 days of logs inside the `/app/server/logs/` directory. You can mount a host directory to extract them:

```bash
docker run -p 3000:3000 -v /var/log/medcases:/app/server/logs medcases
```

## Environment Variables

The application can be configured using the following environment variables.

### Build-Time Variables (Docker Build)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_BASE_PATH` | The base URL path for the client application (e.g., `/medcases`). This is baked into the client build. | `/` |

### Runtime Variables (Docker Run)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | The port the server listens on. | `3000` |
| `BASE_PATH` | The base path for the server routes and static files. **Must match `VITE_BASE_PATH` used during build.** | `/` |
| `CLIENT_URL` | The URL of the client (used for CORS). In the unified Docker deployment, this is usually the same origin, so the default works. | `http://localhost:5173` (Dev) |

## Nginx Reverse Proxy Example

If you are running MedCases behind an Nginx reverse proxy (e.g., at `example.com/medcases`), use the following configuration snippet:

```nginx
location /medcases/ {
    proxy_pass http://localhost:3000/medcases/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

**Note:** Ensure you built the image with `VITE_BASE_PATH=/medcases` and ran it with `BASE_PATH=/medcases`.
