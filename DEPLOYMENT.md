# MedCases Deployment & Production Guide

This guide details the hardware requirements, architecture, capacity benchmarks, and production deployment options for MedCases. It is designed both for individual instructors and institutional university IT administrators.

---

## 1. Architectural Overview & Institutional Benefits

MedCases is engineered with a **client-side first, zero-database architecture**:

- **Zero Database (No SQL/NoSQL engine):** There is no PostgreSQL, MySQL, or MongoDB to install, maintain, tune, or back up.
- **Zero Personally Identifiable Information (PII) & GDPR Compliance:** Students participate anonymously using a 4-digit room code without user accounts, emails, or passwords. No sensitive student data is ever written to disk.
- **Client-Side Media Processing:** Medical imaging (radiographs, CT, histology, ECGs) is packaged into local `.medcase` ZIP archives and extracted directly in the presenter's browser using Web APIs. **The server never streams or stores heavy image binaries**, transmitting only lightweight WebSocket JSON control packets (~100–300 bytes each).
- **Single-Binary Delivery:** The production Docker image bundles both the React frontend and Node.js WebSocket backend into a single Alpine container weighing less than 150 MB.

---

## 2. Hardware Sizing & Capacity Benchmarks

Because the server acts solely as a real-time WebSocket state coordinator and static file host, its resource consumption is exceptionally low.

| Resource | Minimum (Single Lecture) | Recommended (Faculty / Campus) | Technical Context |
| :--- | :--- | :--- | :--- |
| **CPU** | 1 Shared vCPU | 1–2 Dedicated vCPUs | Node.js asynchronous event loop handles thousands of concurrent I/O events on a single thread. |
| **RAM** | 512 MB | 1 GB – 2 GB | Baseline runtime consumes ~60 MB. Each active Socket.io connection consumes ~5–10 KB. 1,000 students = ~15 MB of socket memory. |
| **Disk** | 5 GB SSD | 10–20 GB SSD | Docker image is ~150 MB. Disk space is only utilized for operating system logs and log rotation. |
| **Network** | 100 Mbps | 1 Gbps | Initial bundle is ~180 kB (gzip). Live answer submissions and heartbeat packets average < 300 bytes. |

### Concurrency Benchmark
- **Single VPS (1 vCPU, 1 GB RAM):** Supports **1,000 – 3,000 concurrent students** across **10–30 simultaneous lecture halls**.
- **Answer Surge Protection:** The server batches student responses using an internal 1000 ms throttle (`ANSWERS_BATCH_INTERVAL_MS = 1000`). If 300 students submit their answer within the same second, the server aggregates the results and broadcasts only one statistical update to the presenter, preventing CPU saturation.

---

## 3. Recommended Production Deployment: Docker Compose + Caddy (Automatic HTTPS)

The most robust and elegant way to deploy MedCases in production is using Docker Compose with **Caddy** as a reverse proxy. Caddy automatically provisions, configures, and renews TLS/SSL certificates from Let's Encrypt with zero manual intervention.

### Prerequisites
- Docker and Docker Compose installed (`docker compose version >= 2.0`)
- A public domain name (e.g., `medcases.your-university.edu`) pointing to your server's IP address (A / AAAA DNS record)
- Ports `80` and `443` open in your firewall

### 1-Minute Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/paunoko/medcases.git
   cd medcases
   ```

2. **Configure your domain:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set your public domain name:
   ```ini
   DOMAIN=medcases.your-university.edu
   ACME_EMAIL=admin@your-university.edu
   ```

3. **Launch the services:**
   ```bash
   docker compose up -d
   ```

4. **Verify:**
   Open `https://medcases.your-university.edu` in your browser. Caddy will have automatically obtained a valid HTTPS certificate, and MedCases is live.

To view live container logs:
```bash
docker compose logs -f medcases
```

To stop or restart:
```bash
docker compose down
docker compose up -d
```

---

## 4. Standalone Docker Deployment

If your institution already runs a centralized reverse proxy (e.g., Traefik, HAProxy, or enterprise Nginx) or you wish to run MedCases standalone on an internal port:

### Building the Image
```bash
# Build for root URL path (default)
docker build -t medcases .

# Or build for a custom subpath (e.g., /medcases)
docker build --build-arg VITE_BASE_PATH=/medcases -t medcases .
```

### Running the Container
```bash
# Basic run on port 3000
docker run -d \
  --name medcases \
  --restart unless-stopped \
  -p 3000:3000 \
  -v medcases_logs:/app/server/logs \
  medcases
```

---

## 5. Reverse Proxy Configuration Examples

### Nginx
If placing MedCases behind an existing Nginx server, ensure WebSocket upgrade headers are passed correctly:

```nginx
server {
    listen 443 ssl http2;
    server_name medcases.example.edu;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # WebSocket support (Crucial for Socket.io)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for persistent live classroom sessions
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

### Caddy (Standalone `Caddyfile`)
```caddyfile
medcases.example.edu {
    reverse_proxy localhost:3000
    encode zstd gzip
}
```

---

## 6. Environment Variables Reference

| Variable | Scope | Description | Default |
| :--- | :--- | :--- | :--- |
| `PORT` | Runtime | Port the internal Express HTTP server listens on. | `3000` |
| `BASE_PATH` | Runtime | Base URL path for server routes and static assets. Must match build arg if subpath is used. | `/` |
| `CLIENT_URL` | Runtime | Optional CORS allowed origin. In unified container deployment, frontend and backend share the same origin. | Empty (same-origin) |
| `VITE_BASE_PATH` | Build-time | Subpath prefix baked into the Vite frontend build. | `/` |
| `DOMAIN` | Compose | Public domain used by Caddy for automatic Let's Encrypt SSL issuance. | `localhost` |
| `ACME_EMAIL` | Compose | Email contact for Let's Encrypt certificate renewal notices. | `admin@example.com` |

---

## 7. Institutional IT FAQ & Security Checklist

#### Does MedCases store student responses permanently?
No. All student answers and active room states exist solely in the server's volatile RAM. Once the instructor ends the session or 60 minutes of inactivity elapse, the room and answers are purged immediately (`rooms.delete(roomId)`).

#### Can students or attendees tamper with slides or reveal answers?
No. Presenter controls and updates require a cryptographically random `teacherSecret` (UUIDv4) issued exclusively to the teacher socket and persisted in the teacher's browser session. Student socket connections have zero authority to change slides or reveal answers.

#### Can students see correct answers in the network tab before reveal?
No. The backend uses strict payload sanitization (`sanitizer.ts`). The `isCorrect` flags and teacher model answers are completely stripped from student payloads and are only transmitted once the teacher explicitly clicks "Lock & reveal".

#### What firewall ports are required?
- Inbound: Port `80` (HTTP, redirects to HTTPS) and `443` (HTTPS / WSS).
- Outbound: Standard DNS (`53`) and HTTPS (`443`) for Let's Encrypt certificate issuance.

#### How do we scale horizontally across multiple servers?
If institutional adoption grows beyond 5,000+ simultaneous students across hundreds of concurrent halls, simply attach the official `@socket.io/redis-adapter` to the backend. This enables running multiple MedCases container replicas behind a round-robin load balancer with sticky sessions.
