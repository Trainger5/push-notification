const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const webpush = require('web-push');
const geoip = require('geoip-lite');
const { getDatastores } = require('../storage/datastores');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

// Create customer with login credentials
router.post(
  '/customers',
  body('email').isEmail(),
  body('password').isString().isLength({ min: 6 }),
  body('name').isString().isLength({ min: 2 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password, name } = req.body;
    const { users, customers, pushSettings } = getDatastores();
    const existingUser = await users.findOne({ email });
    if (existingUser) return res.status(409).json({ error: 'Email already in use' });
    
    // Get country from IP address
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
    const geo = geoip.lookup(ip);
    const country = geo ? geo.country : 'Unknown';
    const city = geo ? geo.city : null;
    const timezone = geo ? geo.timezone : null;
    
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await users.insert({ email, passwordHash, role: 'customer', createdAt: new Date().toISOString() });
    const apiKey = uuidv4();
    const customer = await customers.insert({ 
      userId: user._id, 
      email, 
      name, 
      apiKey, 
      country,
      city,
      timezone,
      registrationIp: ip,
      createdAt: new Date().toISOString(), 
      active: true 
    });
    // Auto-generate VAPID keys and seed push settings
    const keys = webpush.generateVAPIDKeys();
    await pushSettings.insert({
      customerId: customer._id,
      vapidPublicKey: keys.publicKey,
      vapidPrivateKey: keys.privateKey,
      vapidSubject: process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
      title: `${name} Notifications`,
      iconUrl: null,
      badgeUrl: null,
      defaultUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    res.status(201).json({ id: customer._id, email, name, apiKey, country, city, timezone });
  }
);

// List customers
router.get('/customers', async (req, res) => {
  const { customers } = getDatastores();
  const list = await customers.find({}).sort({ createdAt: -1 });
  res.json(list);
});

// Toggle customer active
router.patch('/customers/:id/toggle', async (req, res) => {
  const { customers } = getDatastores();
  const customer = await customers.findOne({ _id: req.params.id });
  if (!customer) return res.status(404).json({ error: 'Not found' });
  const updated = await customers.update({ _id: customer._id }, { $set: { active: !customer.active } }, { returnUpdatedDocs: true });
  res.json(updated);
});

// Regenerate API key
router.post('/customers/:id/keys/regenerate', async (req, res) => {
  const { customers } = getDatastores();
  const customer = await customers.findOne({ _id: req.params.id });
  if (!customer) return res.status(404).json({ error: 'Not found' });
  const apiKey = uuidv4();
  const updated = await customers.update({ _id: customer._id }, { $set: { apiKey } }, { returnUpdatedDocs: true });
  res.json({ apiKey: updated.apiKey });
});

module.exports = router;


