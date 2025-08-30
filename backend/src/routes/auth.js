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

// Removed potentially problematic debug middleware

// Test database connectivity
router.get('/test-db', async (req, res) => {
  try {
    const { users } = getDatastores();
    const allUsers = await users.find({});
    console.log('DB Test - Found users:', allUsers.length);
    res.json({ 
      message: 'Database test', 
      userCount: allUsers.length,
      users: allUsers.map(u => ({ email: u.email, role: u.role, hasPasswordHash: !!u.password_hash }))
    });
  } catch (error) {
    console.error('DB Test Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Simple test login without validation
router.post('/login-simple', (req, res) => {
  console.log('Simple login hit');
  console.log('Body:', req.body);
  res.json({ message: 'Simple login works', body: req.body });
});

router.post('/login', async (req, res) => {
  console.log('🔑 LOGIN ATTEMPT:', new Date().toISOString());
  console.log('📧 Email:', req.body?.email);
  console.log('🔒 Password provided:', !!req.body?.password);
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    console.log('🗄️ Getting database...');
    const { users } = getDatastores();
    
    console.log('👤 Looking up user:', email);
    const user = await users.findOne({ email });
    console.log('🔍 User found:', !!user);
    
    if (!user) {
      console.log('❌ User not found in database');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('👤 User details:', {
      id: user.id,
      email: user.email,
      role: user.role,
      hasPasswordHash: !!user.password_hash
    });
    
    console.log('🔐 Comparing passwords...');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log('✅ Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('🎫 Creating token...');
    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email }, 
      process.env.JWT_SECRET || 'dev-secret', 
      { expiresIn: '7d' }
    );
    
    console.log('🎉 LOGIN SUCCESS');
    res.json({ token, role: user.role, email: user.email });
    
  } catch (error) {
    console.error('💥 LOGIN ERROR:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Self-registration endpoint
router.post(
  '/register',
  // registrationLimiter, // TODO: Re-enable rate limiting later
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
    const country = geo && geo.country ? geo.country.substring(0, 2) : null; // Ensure max 2 chars
    const city = geo ? geo.city : null;
    const timezone = geo ? geo.timezone : null;
    const region = geo ? geo.region : null;
    
    // Create user
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await users.insert({ 
      email, 
      password_hash: passwordHash, 
      role: 'customer', 
      created_at: new Date() 
    });
    
    // Create customer with location info
    const apiKey = uuidv4();
    const customer = await customers.insert({ 
      user_id: user.id, 
      email, 
      name: name, 
      company_name: companyName,
      api_key: apiKey, 
      country,
      timezone,
      plan: 'free',
      status: 'active',
      subscriber_limit: 1000,
      monthly_quota: 10000,
      quota_used: 0
    });
    
    // Auto-generate VAPID keys and seed push settings
    const keys = webpush.generateVAPIDKeys();
    await pushSettings.insert({
      customer_id: customer.id,
      vapid_public_key: keys.publicKey,
      vapid_private_key: keys.privateKey,
      vapid_subject: `mailto:${email}`,
      default_title: `${companyName} Notifications`,
      default_icon_url: null,
      default_badge_url: null,
      default_url: null
    });
    
    // Auto-login after registration
    const token = jwt.sign(
      { userId: user.id, role: 'customer', email: user.email }, 
      process.env.JWT_SECRET || 'dev-secret', 
      { expiresIn: '7d' }
    );
    
    res.status(201).json({ 
      token, 
      role: 'customer', 
      email, 
      message: 'Registration successful',
      customer: {
        id: customer.id,
        name: companyName,
        apiKey,
        country,
        city,
        timezone
      },
      vapidKeys: {
        publicKey: keys.publicKey,
        privateKey: keys.privateKey
      }
    });
  }
);

module.exports = router;


