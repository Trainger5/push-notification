const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const webpush = require('web-push');
const geoip = require('geoip-lite');
const { getDatastores } = require('../storage/datastores');
const { authLimiter, registrationLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post(
  '/login',
  authLimiter,
  body('email').isEmail(),
  body('password').isString().isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password } = req.body;
    const { users, customers } = getDatastores();
    const user = await users.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    // Block login for disabled customers
    if (user.role === 'customer') {
      const customer = await customers.findOne({ userId: user._id });
      const contactUrl = process.env.ADMIN_CONTACT_URL || process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
      if (!customer || customer.active === false) {
        return res.status(403).json({ error: 'Account disabled', contactUrl });
      }
    }
    const token = jwt.sign({ userId: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
    res.json({ token, role: user.role, email: user.email });
  }
);

// Self-registration endpoint
router.post(
  '/register',
  registrationLimiter,
  body('email').isEmail(),
  body('password').isString().isLength({ min: 6 }),
  body('name').isString().isLength({ min: 2 }),
  body('companyName').isString().isLength({ min: 2 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { email, password, name, companyName } = req.body;
    const { users, customers, pushSettings } = getDatastores();
    
    // Check if email already exists
    const existingUser = await users.findOne({ email });
    if (existingUser) return res.status(409).json({ error: 'Email already in use' });
    
    // Get country from IP address
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
    const geo = geoip.lookup(ip);
    const country = geo ? geo.country : 'Unknown';
    const city = geo ? geo.city : null;
    const timezone = geo ? geo.timezone : null;
    const region = geo ? geo.region : null;
    
    // Create user
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await users.insert({ 
      email, 
      passwordHash, 
      role: 'customer', 
      createdAt: new Date().toISOString() 
    });
    
    // Create customer with location info
    const apiKey = uuidv4();
    const customer = await customers.insert({ 
      userId: user._id, 
      email, 
      name: companyName, 
      contactName: name,
      apiKey, 
      country,
      city,
      region,
      timezone,
      registrationIp: ip,
      createdAt: new Date().toISOString(), 
      active: true,
      plan: 'free',
      subscriberLimit: 1000
    });
    
    // Auto-generate VAPID keys and seed push settings
    const keys = webpush.generateVAPIDKeys();
    await pushSettings.insert({
      customerId: customer._id,
      vapidPublicKey: keys.publicKey,
      vapidPrivateKey: keys.privateKey,
      vapidSubject: `mailto:${email}`,
      title: `${companyName} Notifications`,
      iconUrl: null,
      badgeUrl: null,
      defaultUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Auto-login after registration
    const token = jwt.sign(
      { userId: user._id, role: 'customer', email: user.email }, 
      process.env.JWT_SECRET || 'dev-secret', 
      { expiresIn: '7d' }
    );
    
    res.status(201).json({ 
      token, 
      role: 'customer', 
      email, 
      message: 'Registration successful',
      customer: {
        id: customer._id,
        name: companyName,
        apiKey,
        country,
        city,
        timezone
      }
    });
  }
);

module.exports = router;


