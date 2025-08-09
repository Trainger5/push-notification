import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import webPush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories
const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_DIR = path.join(__dirname, 'config');
const PUBLIC_DIR = path.join(__dirname, 'public');

ensureDir(DATA_DIR);
ensureDir(CONFIG_DIR);
ensureDir(PUBLIC_DIR);

const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'subscriptions.json');
const VAPID_FILE = path.join(CONFIG_DIR, 'vapid.json');

// Create file if missing
if (!fs.existsSync(SUBSCRIPTIONS_FILE)) {
  fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify({}, null, 2));
}

// Load or create VAPID keys
let vapidKeys;
if (fs.existsSync(VAPID_FILE)) {
  vapidKeys = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf-8'));
} else {
  vapidKeys = webPush.generateVAPIDKeys();
  fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2));
}

const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
webPush.setVapidDetails(VAPID_SUBJECT, vapidKeys.publicKey, vapidKeys.privateKey);

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || '';

app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true }));

// Serve static assets (SDK and default SW)
app.use(express.static(PUBLIC_DIR));

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true, message: 'Web Push service running' });
});

// Return VAPID public key so clients can subscribe
app.get('/api/vapidPublicKey', (_req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// Save subscription for a given siteId
app.post('/api/subscriptions', async (req, res) => {
  try {
    const { siteId, subscription } = req.body || {};
    if (!siteId || !subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'siteId and valid subscription are required' });
    }

    const store = await readSubscriptions();
    const list = Array.isArray(store[siteId]) ? store[siteId] : [];

    // De-duplicate by endpoint
    const exists = list.findIndex((s) => s.endpoint === subscription.endpoint);
    if (exists === -1) {
      list.push(subscription);
      store[siteId] = list;
      await writeSubscriptions(store);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Error saving subscription', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Send a push notification to all subscribers of a siteId
app.post('/api/notify', requireApiKeyIfConfigured, async (req, res) => {
  const { siteId, title, body, icon, image, badge, tag, url, data, actions, ttl } = req.body || {};
  if (!siteId || !title) {
    return res.status(400).json({ error: 'siteId and title are required' });
  }

  try {
    const store = await readSubscriptions();
    const list = Array.isArray(store[siteId]) ? store[siteId] : [];
    if (list.length === 0) {
      return res.json({ ok: true, sent: 0, removed: 0 });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon,
      image,
      badge,
      tag,
      data: { ...(data || {}), url },
      actions: Array.isArray(actions) ? actions : undefined
    });

    const sendOptions = {};
    if (typeof ttl === 'number') sendOptions.TTL = ttl;

    let sent = 0;
    let removed = 0;
    const results = await Promise.allSettled(
      list.map((sub) => webPush.sendNotification(sub, payload, sendOptions))
    );

    const stillValid = [];
    results.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        sent += 1;
        stillValid.push(list[idx]);
      } else {
        const err = result.reason;
        const statusCode = err?.statusCode || err?.status || 0;
        if (statusCode === 410 || statusCode === 404) {
          removed += 1;
        } else {
          // Keep if transient failure
          stillValid.push(list[idx]);
        }
      }
    });

    if (stillValid.length !== list.length) {
      const store2 = await readSubscriptions();
      store2[siteId] = stillValid;
      await writeSubscriptions(store2);
    }

    res.json({ ok: true, sent, removed, total: list.length });
  } catch (err) {
    console.error('Error sending push', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Simple index help
app.get('/', (_req, res) => {
  res.type('text/plain').send(
    'Web Push service is running.\n\n' +
      'Endpoints:\n' +
      'GET  /api/vapidPublicKey\n' +
      'POST /api/subscriptions  { siteId, subscription }\n' +
      'POST /api/notify         { siteId, title, body, ... }\n' +
      '\nStatic files: /sdk.js, /sw.js\n'
  );
});

app.listen(PORT, () => {
  console.log(`Web Push server listening on http://localhost:${PORT}`);
});

// Utilities
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function readSubscriptions() {
  const content = await fs.promises.readFile(SUBSCRIPTIONS_FILE, 'utf-8');
  try {
    const json = JSON.parse(content);
    return json && typeof json === 'object' ? json : {};
  } catch {
    return {};
  }
}

async function writeSubscriptions(store) {
  await fs.promises.writeFile(SUBSCRIPTIONS_FILE, JSON.stringify(store, null, 2));
}

function requireApiKeyIfConfigured(req, res, next) {
  if (!API_KEY) return next();
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : (req.headers['x-api-key'] || '');
  if (token && token === API_KEY) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}


