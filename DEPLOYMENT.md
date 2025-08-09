## Deployment Guide

This document explains how to deploy the Web Push Notification Service to production using Docker, Docker Compose, or a bare‑metal Node process behind a reverse proxy with HTTPS.

### Prerequisites
- A Linux host with Docker or Node.js 18+
- A domain, e.g., `push.example.com`, with a DNS A/AAAA record pointing to your server
- Open ports 80 and 443 if you plan to terminate TLS on the host (recommended)

### Environment variables
- `API_KEY` (recommended): Secret to protect `POST /api/notify`
- `VAPID_SUBJECT`: Contact string for VAPID (e.g., `mailto:admin@example.com`)
- `PORT`: Service port (default `3000`)

Persist the following directories so data survives restarts:
- `config/` → stores auto-generated VAPID keys
- `data/` → stores subscriptions by `siteId`

### Option A: Docker Compose (recommended)
1) Ensure the provided `docker-compose.yml` exists in your project root
2) Start the service:
```bash
docker compose up -d
```
3) Customize environment variables in `docker-compose.yml` as needed (uncomment `API_KEY`). Volumes are already mounted to persist `config/` and `data/`.

### Option B: Docker (single container)
Build and run manually:
```bash
docker build -t web-push-service .
docker run -d --name web-push \
  -p 3000:3000 \
  -e VAPID_SUBJECT=mailto:admin@example.com \
  -e API_KEY=your-secret-key \
  -v $(pwd)/config:/app/config \
  -v $(pwd)/data:/app/data \
  web-push-service
```

### Option C: Bare‑metal (PM2)
Install dependencies and run with PM2 (ensure Node 18+):
```bash
npm ci --only=production
pm2 start server.js --name web-push-service -- \
  && pm2 save
```
Set env vars when starting or via an ecosystem file:
```bash
API_KEY=your-secret-key \
VAPID_SUBJECT=mailto:admin@example.com \
PORT=3000 \
pm2 start server.js --name web-push-service
```

### HTTPS reverse proxy (Nginx example)
Terminate TLS with Nginx and proxy to the Node container/process.

```nginx
server {
  listen 80;
  server_name push.example.com;
  location / {
    return 301 https://$host$request_uri;
  }
}

server {
  listen 443 ssl http2;
  server_name push.example.com;

  ssl_certificate     /etc/letsencrypt/live/push.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/push.example.com/privkey.pem;

  client_max_body_size 2m;

  location / {
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_pass http://127.0.0.1:3000;
  }
}
```

Issue certificates with Certbot (one-time):
```bash
sudo apt-get update && sudo apt-get install -y nginx certbot python3-certbot-nginx
sudo certbot --nginx -d push.example.com
```

### Verification
1) Visit `https://push.example.com/health` → should return `{ ok: true }`
2) Visit `https://push.example.com/test.html` → subscribe and send a test notification

### How client sites integrate
1) Copy your service worker to their origin as `/sw.js` (same-origin requirement)
2) Add the SDK and initialize with their assigned `siteId`:
```html
<script src="https://push.example.com/sdk.js"></script>
<script>
  // Ideally call after a user gesture
  PushClient.init({ serverUrl: 'https://push.example.com', siteId: 'their-site-id' });
</script>
```
3) Send notifications via your API:
```bash
curl -X POST https://push.example.com/api/notify \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -d '{
        "siteId": "their-site-id",
        "title": "Hello",
        "body": "World",
        "url": "https://their.site/page"
      }'
```

### Operations
- Health check: `GET /health`
- Logs: container logs or PM2 logs
- Backups: snapshot `config/` and `data/`
- Scaling: behind a load balancer; switch subscription storage to a DB for large scale (schema is simple per `siteId`)

### Security recommendations
- Always set `API_KEY` and rotate periodically
- Serve only over HTTPS
- Optionally restrict CORS to known origins (server is currently permissive; can be tightened if needed)

### Troubleshooting
- No notification appears: ensure permission granted, service worker installed, and device supports Push
- 401 on send: missing/wrong `Authorization` or `x-api-key`
- 410/404 on send results: server auto-cleans stale subscriptions


