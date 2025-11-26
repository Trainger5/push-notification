const express = require('express');
const webpush = require('web-push');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'subscriptions.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

// Validate VAPID keys
if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  console.error('❌ VAPID keys not found in environment variables!');
  console.error('Please run: npm run generate-keys');
  process.exit(1);
}

console.log('✅ VAPID keys loaded successfully');
console.log('Public Key:', vapidKeys.publicKey);

webpush.setVapidDetails(
  'mailto:admin@localhost.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Load subscriptions from file
let subscriptions = [];
try {
  if (fs.existsSync(DATA_FILE)) {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    subscriptions = JSON.parse(data);
    console.log(`✅ Loaded ${subscriptions.length} subscriptions from file.`);
  } else {
    console.log('ℹ️ No existing subscriptions file found. Starting fresh.');
  }
} catch (error) {
  console.error('❌ Error loading subscriptions:', error);
}

// Helper to save subscriptions
const saveSubscriptions = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(subscriptions, null, 2));
    console.log('💾 Subscriptions saved to file.');
  } catch (error) {
    console.error('❌ Error saving subscriptions:', error);
  }
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/api/vapid-public-key', (req, res) => {
  console.log('VAPID Public Key requested:', vapidKeys.publicKey);
  res.json({ publicKey: vapidKeys.publicKey });
});
app.post('/api/subscribe', (req, res) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription' });
  }
  const exists = subscriptions.find(sub => sub.endpoint === subscription.endpoint);
  if (!exists) {
    subscriptions.push(subscription);
    saveSubscriptions();
  }
  res.status(201).json({ message: 'Subscription added successfully' });
});
app.post('/api/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  const initialLength = subscriptions.length;
  subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
  if (subscriptions.length !== initialLength) {
    saveSubscriptions();
  }
  res.json({ message: 'Unsubscribed successfully' });
});
app.post('/api/send-notification', async (req, res) => {
  const { title, body, icon, url } = req.body;
  if (!title || !body)
    return res.status(400).json({ error: 'Title and body are required' });
  const payload = JSON.stringify({
    title,
    body,
    icon: icon || '/icon-192x192.png',
    url: url || '/',
    badge: '/badge-72x72.png'
  });

  const results = await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification(subscription, payload);
      return { success: true, endpoint: subscription.endpoint };
    } catch (error) {
      // Optional: Remove invalid subscriptions automatically
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log(`Removing invalid subscription: ${subscription.endpoint}`);
        subscriptions = subscriptions.filter(s => s.endpoint !== subscription.endpoint);
        saveSubscriptions();
      }
      return { success: false, endpoint: subscription.endpoint, error: error.message };
    }
  }));
  res.json({ message: `Notifications sent.`, results });
});
app.get('/api/stats', (req, res) => {
  res.json({ totalSubscribers: subscriptions.length });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
