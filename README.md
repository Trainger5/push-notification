## Push Notification Platform (Backend + Dashboard + SDK)

Production‑ready web push notifications with multi‑tenant support, customer/admin dashboards, campaigns, templates, segments, webhooks, and a zero‑config SDK.

### Highlights
- 🔐 Multi‑tenant architecture (customers isolated)
- 📊 Admin + customer dashboards (SPA)
- 🎯 Templates, segments, scheduled sends, campaigns
- 📈 Analytics + event metrics (open/click/close)
- 🔗 Webhooks for real‑time integrations
- 🧩 Lightweight SDK: just `apiKey` + `baseUrl`

### Quick Start

1) Backend
```bash
cd backend
npm install
npm run setup      # creates DB, runs migrations, seeds admin+demo+VAPID
npm start          # http://localhost:4000
```

2) Frontend (Dashboard)
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Login (seeded users):
- Admin: admin@example.com / admin123
- Customer: demo@customer.com / password123

### SDK Integration
Add to your site (no manual service worker needed):
```html
<script>
  const API_KEY = 'YOUR_API_KEY';         // from Dashboard → Settings
  const SERVER_URL = 'http://localhost:4000';

  function loadNotificationSDK() {
    const s = document.createElement('script');
    s.src = SERVER_URL + '/sdk.js';
    s.onload = () => {
      PN.init({ apiKey: API_KEY, baseUrl: SERVER_URL })
        .then(() => console.log('✅ Push ready'))
        .catch(err => console.error('Init failed:', err));
    };
    document.head.appendChild(s);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNotificationSDK);
  } else {
    loadNotificationSDK();
  }
</script>
```
The SDK will:
- Request permission
- Register `/pn-sw.js` from your backend
- Create + POST the subscription to the server using your `apiKey`

### Send Notifications

- Dashboard: use Send/Segments/Templates/Scheduler tabs (NewDashboard)
- API (JWT auth):
```bash
# 1) Login to get a token
curl -s http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@customer.com","password":"password123"}'

# 2) Send
curl -s -X POST http://localhost:4000/api/customer/notify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Hello","body":"Your first push!","url":"https://example.com"}'
```

Scheduling:
```bash
curl -s -X POST http://localhost:4000/api/scheduled/schedule \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Sale!","body":"Starts soon","scheduledFor":"2025-12-31T12:00:00Z"}'
```

Templates:
```bash
# Create
POST /api/templates/create  { name, title, body, ... }
# Send
POST /api/templates/:id/send  { variables?, scheduledFor?, timezone? }
```

Segments:
```bash
# Create
POST /api/segments/create  { name, criteria: {...} }
# Notify
POST /api/segments/:id/notify  { title, body, ... }
```

Campaigns:
- Create: `POST /api/campaigns/create`
- Start/Pause/Delete: `/api/campaigns/:campaignId/{start|pause|delete}`
- Triggered flows: `POST /api/campaigns/trigger` with `{ eventType, user_id, eventData }`
- Executor runs automatically every minute

Webhooks:
- Create/Test/List/Stats under `/api/webhooks/*`

### Environment
Create `backend/.env`:
```env
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=push_notification_system
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_here
VAPID_SUBJECT=mailto:admin@yoursite.com
```
Notes:
- VAPID keys are auto‑generated for the demo customer during setup.
- Use HTTPS in production (required by browsers for push).

### Dev Tips
- Backend: logs requests and errors; scheduler + campaign executor start automatically.
- Frontend: runs on `5173` (Vite) and proxies `/api`, `/sdk.js`, `/pn-sw.js` → backend `4000`.

### Production
- Run backend with PM2 or systemd.
- Build the frontend (`npm run build` in `frontend`) and host as static files.
- Nginx example: proxy `/api`, `/sdk.js`, `/pn-sw.js` to backend; serve the SPA for `/`.

### Troubleshooting
- Ensure `baseUrl` in SDK init matches your backend origin.
- If no prompts: check HTTPS and permission settings.
- If sends succeed but no delivery: verify subscriptions exist and VAPID keys are present in Dashboard → Settings.

### License
MIT

