# Push Notification System

A self-hosted web push notification system built with Node.js, Express, and the Web Push API. Send browser push notifications to subscribed users across all devices and platforms.

## ✨ Features

- 🔔 **Web Push Notifications** - Send notifications to Chrome, Firefox, Edge, Safari
- 📱 **Cross-Platform** - Works on desktop and mobile browsers
- 🔒 **Secure** - Uses VAPID authentication and requires HTTPS
- 💾 **Persistent Subscriptions** - Stores subscriptions to survive server restarts
- 🎨 **Modern UI** - Clean, responsive interface for testing
- 🔧 **Easy Setup** - Simple configuration with environment variables

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd push-notification
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Generate VAPID keys**
   ```bash
   npm run generate-keys
   ```
   This creates a `.env` file with your VAPID public and private keys.

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📖 API Documentation

### Get VAPID Public Key
```http
GET /api/vapid-public-key
```

**Response:**
```json
{
  "publicKey": "BJKz7K5..."
}
```

### Subscribe to Notifications
```http
POST /api/subscribe
Content-Type: application/json

{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "auth": "...",
    "p256dh": "..."
  }
}
```

**Response:**
```json
{
  "message": "Subscription added successfully"
}
```

### Unsubscribe from Notifications
```http
POST /api/unsubscribe
Content-Type: application/json

{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

### Send Notification
```http
POST /api/send-notification
Content-Type: application/json

{
  "title": "Hello!",
  "body": "This is a test notification",
  "icon": "/icon-192x192.png",
  "url": "/"
}
```

**Response:**
```json
{
  "message": "Notifications sent.",
  "results": [...]
}
```

### Get Statistics
```http
GET /api/stats
```

**Response:**
```json
{
  "totalSubscribers": 42
}
```

## 🛠️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
PORT=3000
NODE_ENV=development
```

## 📁 Project Structure

```
push-notification/
├── public/               # Client-side files
│   ├── index.html       # Main UI
│   ├── main.js          # Client logic
│   ├── service-worker.js # Service worker for push
│   └── style.css        # Styles
├── server.js            # Express server
├── ecosystem.config.js  # PM2 configuration
├── generate-vapid.js    # VAPID key generator
├── package.json         # Dependencies
├── DEPLOYMENT.md        # Deployment guide
└── README.md           # This file
```

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions for:
- Hostinger VPS
- DigitalOcean
- AWS EC2
- Heroku
- And more...

### Quick Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS (required for Web Push API)
- [ ] Set up process manager (PM2 recommended)
- [ ] Configure reverse proxy (Nginx/Apache)
- [ ] Set up SSL certificate (Let's Encrypt)
- [ ] Add authentication to `/api/send-notification`
- [ ] Implement rate limiting
- [ ] Set up monitoring

## 🔒 Security

> **⚠️ Warning:** The default setup has no authentication. Before deploying to production:

1. **Add API Authentication** - Protect the send notification endpoint
2. **Implement Rate Limiting** - Prevent abuse
3. **Use HTTPS** - Required for Web Push API
4. **Validate Input** - Sanitize all user inputs
5. **Update Dependencies** - Keep packages up to date

## 🐛 Troubleshooting

### Notifications not working?

1. **Check HTTPS** - Web Push requires HTTPS (except localhost)
2. **Check browser permissions** - Ensure notifications are allowed
3. **Check VAPID keys** - Verify they're set in `.env`
4. **Check console** - Look for errors in browser console

### Can't subscribe?

1. **Clear browser data** - Remove old subscriptions
2. **Check service worker** - Ensure it's registered
3. **Check CORS** - Verify CORS settings if using different domain

## 📊 Browser Support

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome  | ✅ 50+  | ✅ 50+ |
| Firefox | ✅ 44+  | ✅ 48+ |
| Safari  | ✅ 16+  | ✅ 16.4+ |
| Edge    | ✅ 79+  | ✅ 79+ |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [web-push](https://github.com/web-push-libs/web-push) - Web Push library for Node.js
- [Express](https://expressjs.com/) - Web framework for Node.js
- [MDN Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) - Documentation and guides

## 📞 Support

For questions or issues:
- Open an issue on GitHub
- Check the [DEPLOYMENT.md](./DEPLOYMENT.md) guide
- Review server logs: `pm2 logs push-notification`

---

**Made with ❤️ using Node.js and Web Push API**
