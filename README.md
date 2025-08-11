## Web Push Notification Service (ready-to-use)

See `DEPLOYMENT.md` for production deployment instructions.

This is a small, production-ready Web Push backend with a tiny client SDK you can integrate into any website. It uses the W3C Push API and VAPID.

### What you get
- **HTTP API** to save subscriptions and send notifications
- **SDK** (`/sdk.js`) for easy client integration
- **Service Worker** (`/sw.js`) to show notifications
- **File-based storage** for simplicity (can swap to DB later)

### Requirements
- Node.js 18+
- HTTPS in production (Push requires secure origin). `http://localhost` works for local dev.

### Quick start
1) Install and run

```bash
npm install
npm run start
# Server runs on http://localhost:3000
```

2) Copy the default service worker to your website (must be same-origin):

```
https://YOUR_SITE/sw.js  ← copy the file from this repo's `public/sw.js`
```

3) Add the SDK to your website and initialize:

```html
<script src="https://YOUR_PUSH_SERVER/sdk.js"></script>
<script>
  // Use any identifier you like for siteId (e.g., domain, slug, UUID)
  PushClient.init({
    serverUrl: 'https://YOUR_PUSH_SERVER',
    siteId: 'YOUR_SITE_ID'
  });
</script>
```

4) Send a notification from your server or a REST client:

```bash
curl -X POST https://YOUR_PUSH_SERVER/api/notify \
  -H 'Content-Type: application/json' \
  -d '{
        "siteId": "YOUR_SITE_ID",
        "title": "Hello from Web Push",
        "body": "This is a test",
        "icon": "https://your.site/icon.png",
        "url": "https://your.site/landing"
      }'
```

### Endpoints
- `GET /api/vapidPublicKey` → `{ publicKey }`
- `POST /api/subscriptions` → Save a subscription
  - Body: `{ siteId: string, subscription: PushSubscription }`
- `POST /api/notify` → Send to all subscribers of a site
  - Body: `{ siteId, title, body?, icon?, image?, badge?, tag?, url?, data?, actions?, ttl? }`

### How integration works
- The website hosts `/sw.js` on the same origin (required by browsers).
- The SDK registers the service worker, requests notification permission, subscribes the user with the server's VAPID public key, and saves the subscription.
- When you call `/api/notify`, the server sends a push message to all stored subscriptions for that `siteId`. The service worker displays the notification and opens `url` on click.

### Configuration
- The server auto-generates VAPID keys at first start and stores them in `config/vapid.json`.
- You can customize the VAPID subject via `VAPID_SUBJECT` in `.env` (e.g., `mailto:you@example.com`).
- Default port is `3000` (`PORT` env var to change).

### Securing send endpoint
- If you set `API_KEY` (env var), the `POST /api/notify` endpoint will require either:
  - Header `Authorization: Bearer YOUR_API_KEY`, or
  - Header `x-api-key: YOUR_API_KEY`

### Deploy options

#### Docker (recommended)
```bash
docker build -t web-push-service .
docker run -d --name web-push -p 3000:3000 \
  -e VAPID_SUBJECT=mailto:admin@example.com \
  -e API_KEY=your-secret-key \
  -v $(pwd)/config:/app/config \
  -v $(pwd)/data:/app/data \
  web-push-service
```

Or with Compose:

```bash
docker compose up -d
```

#### Bare-metal / PM2
```bash
npm ci --only=production
API_KEY=your-secret-key VAPID_SUBJECT=mailto:admin@example.com PORT=3000 node server.js
```

#### Cloud platforms
- Any Node-compatible host (Render, Railway, Fly.io, Heroku-alikes) works. Add env vars and mount persistent volumes for `config/` and `data/`.

### How sites integrate (production)
1) Host the service worker on the site origin as `/sw.js` (copy from `public/sw.js`, or merge handlers into existing SW).
2) Load the SDK from your push server, then initialize once at page load:

```html
<script src="https://push.example.com/sdk.js"></script>
<script>
  PushClient.init({ serverUrl: 'https://push.example.com', siteId: 'your-site-id' });
  // Consider gating behind a user gesture before calling init()
  // e.g., after a "Enable notifications" button click
</script>
```

3) When you want to send a notification to all subscribers of a site:

```bash
curl -X POST https://push.example.com/api/notify \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -d '{
        "siteId": "your-site-id",
        "title": "Sale starts now",
        "body": "Up to 40% off",
        "icon": "https://your.site/icon.png",
        "url": "https://your.site/sale"
      }'
```

4) Multi-tenant support: use a distinct `siteId` per website/app. The server keeps separate subscription arrays per `siteId`.

### Production notes
- Must be served over HTTPS (except on localhost).
- Keep `config/` and `data/` on persistent storage.
- Rotate `API_KEY` periodically; treat it like a password.
- Handle unsubscriptions automatically: the server removes `410/404` endpoints after failed sends.

### Notes
- To support multiple sites, use different `siteId` values. All subscriptions are kept in `data/subscriptions.json`.
- In production, run behind HTTPS (e.g., Nginx/Traefik). For local testing, `http://localhost` is allowed.
- If you already have a service worker, merge the push handlers from `public/sw.js` into your existing one.

### License
MIT


