## Push Notification System with Customer Dashboard

A complete push notification service with multi-tenant support, customer dashboard, admin panel, and comprehensive analytics.

### Features
- 🔐 **Multi-tenant architecture** with customer isolation
- 📊 **Admin dashboard** for system overview and management
- 👤 **Customer portal** for self-service notification management
- 🎯 **Advanced targeting** by segments, geography, device type
- 📈 **Analytics & metrics** with delivery tracking
- 🔗 **Webhook integration** for real-time events
- 🎨 **Template system** for reusable notifications
- ⏰ **Campaign scheduling** with automated delivery
- 🧪 **A/B testing** for notification optimization

### Quick Start

#### 1. Backend Setup

```bash
cd backend
npm install
npm run setup  # Initialize database and create admin user
npm start      # Server runs on http://13.126.228.42
```

#### 2. Frontend Dashboard Setup

```bash
cd frontend
npm install
npm run build  # Build the admin/customer dashboard
```

#### 3. Basic Integration

Add this script to any website to enable push notifications:

```html
<script src="http://13.126.228.42/sdk.js"></script>
<script>
  const API_KEY = 'your-api-key-here';
  const SERVER_URL = 'http://13.126.228.42';
  
  // Load and initialize SDK
  function loadNotificationSDK() {
    PN.init({
      apiKey: API_KEY,
      baseUrl: SERVER_URL
    }).then(() => {
      console.log('✅ Push notifications ready!');
    }).catch(err => {
      console.error('Failed to initialize:', err);
    });
  }
  
  // Load on page ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNotificationSDK);
  } else {
    loadNotificationSDK();
  }
</script>
```

The SDK automatically:
- Requests notification permission
- Registers service worker from your server
- Creates push subscription
- Sends subscription to your backend

#### 4. Sending Notifications

Via Admin Dashboard:
- Visit `http://13.126.228.42/admin` 
- Login with admin credentials
- Use the notification interface to send to all or targeted subscribers

Via API:
```bash
curl -X POST http://13.126.228.42/api/admin/notify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Test Notification",
    "body": "This is a test message",
    "targetType": "all"
  }'
```

### System Requirements

- **Node.js** 18+ 
- **MySQL/MariaDB** 8.0+
- **HTTPS** in production (required for push notifications)

### Environment Configuration

Create `.env` file in backend directory:

```env
NODE_ENV=production
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=pushnotify
DB_USER=pushuser
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_here
VAPID_SUBJECT=mailto:admin@yoursite.com
```

### Database Setup

The system automatically creates the database schema on first run. Ensure your MySQL user has CREATE database permissions.

### Key API Endpoints

#### Public (SDK Integration)
- `GET /api/config?apiKey=KEY` - Get VAPID public key and settings
- `POST /api/subscribe` - Save push subscription
- `POST /api/unsubscribe` - Remove push subscription
- `GET /sdk.js` - Client SDK
- `GET /pn-sw.js` - Service worker

#### Admin (Requires Authentication)
- `POST /api/admin/notify` - Send notifications to subscribers
- `GET /api/admin/overview` - System statistics
- `GET /api/admin/subscribers` - List all subscribers
- `GET /api/admin/analytics` - Usage analytics

#### Customer (Requires Authentication)  
- `POST /api/customer/notify` - Send notifications (customer scope)
- `GET /api/customer/me` - Customer dashboard data
- `POST /api/customer/settings` - Update push settings

### Testing Your Integration

1. **Create a test HTML file** with the integration script
2. **Serve it locally** (or upload to your site)
3. **Open browser dev tools** to monitor the subscription process
4. **Grant notification permission** when prompted
5. **Check the admin dashboard** to see your subscription
6. **Send a test notification** from the dashboard

### Advanced Features

#### Segmentation
Target users by:
- Geographic location (country, city)
- Device type (mobile, desktop, tablet) 
- Browser type (Chrome, Firefox, Safari)
- Custom tags and segments

#### Campaign Scheduling
- Schedule notifications for specific dates/times
- Recurring campaigns (daily, weekly, monthly)
- Timezone-aware delivery

#### A/B Testing
- Test different notification content
- Compare delivery and engagement rates
- Automatic winner selection

#### Webhooks
- Real-time event notifications
- Subscription created/deleted events
- Delivery status updates
- Custom webhook endpoints

### Troubleshooting

#### Common Issues

**Service Worker 404 Error**
- Ensure your server serves the service worker at `/pn-sw.js`
- Check that `baseUrl` in SDK init matches your server URL

**Permission Denied**
- HTTPS is required in production
- User must grant notification permission
- Some browsers block notifications on HTTP (except localhost)

**Subscription Not Appearing**
- Check browser network tab for API call failures
- Verify API key is correct
- Check server logs for database connection issues

**Notifications Not Received**
- Verify VAPID keys are properly configured
- Check that subscription is active in dashboard
- Browser must be open to receive notifications (except mobile)

### Production Deployment

#### Using PM2
```bash
npm install -g pm2
cd backend
pm2 start src/server.js --name "push-notifications"
pm2 startup
pm2 save
```

#### Using Docker
```bash
docker build -t push-notification-system .
docker run -d -p 4000:4000 \
  -e DB_HOST=your-db-host \
  -e DB_PASSWORD=your-db-password \
  push-notification-system
```

#### Nginx Configuration
```nginx
server {
    listen 443 ssl;
    server_name push.yoursite.com;
    
    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # SSL configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/private.key;
}
```

### License
MIT


