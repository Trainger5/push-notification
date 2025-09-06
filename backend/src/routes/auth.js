const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const webpush = require('web-push');
const geoip = require('geoip-lite');
const { query } = require('../config/database');
const { authLimiter, registrationLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Test database connectivity
router.get('/test-db', async (req, res) => {
  try {
    const [users] = await query('SELECT email, role FROM users');
    console.log('DB Test - Found users:', users.length);
    res.json({ 
      message: 'Database test', 
      userCount: users.length,
      users: users.map(u => ({ email: u.email, role: u.role }))
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

    console.log('📊 Looking up user in database...');
    
    // Find user
    const [users] = await query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    const user = users[0];
    
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('👤 User found:', { id: user.id, email: user.email, role: user.role });
    console.log('🔐 Stored hash exists:', !!user.password_hash);

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log('🔓 Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await query('UPDATE users SET last_login = ? WHERE id = ?', [new Date(), user.id]);

    // Generate token
    const token = jwt.sign(
      { user_id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    console.log('✅ Login successful');
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        email_verified: user.email_verified
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/register', 
  registrationLimiter,
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').isString().isLength({ min: 1, max: 100 }),
  async (req, res) => {
    console.log('📝 REGISTRATION ATTEMPT:', new Date().toISOString());
    console.log('📧 Email:', req.body?.email);
    console.log('👤 Name:', req.body?.name);
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name, plan = 'free' } = req.body;
      
      // Check if user exists
      const [existingUsers] = await query('SELECT id FROM users WHERE email = ?', [email]);
      if (existingUsers.length > 0) {
        console.log('❌ User already exists');
        return res.status(409).json({ error: 'User already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user
      const userId = uuidv4();
      await query(`
        INSERT INTO users (id, email, password_hash, role, email_verified, created_at, updated_at)
        VALUES (?, ?, ?, 'customer', false, ?, ?)
      `, [userId, email, passwordHash, new Date(), new Date()]);

      console.log('✅ User created:', userId);

      // Generate API key
      const apiKey = `pn_${Buffer.from(uuidv4()).toString('base64').replace(/[/+=]/g, '').substring(0, 24)}`;

      // Create customer record
      const customerId = uuidv4();
      await query(`
        INSERT INTO customers 
        (id, user_id, name, email, plan, api_key, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
      `, [customerId, userId, name, email, plan, apiKey, new Date(), new Date()]);

      console.log('✅ Customer created:', customerId);

      // Generate VAPID keys for push notifications
      const vapidKeys = webpush.generateVAPIDKeys();
      
      await query(`
        INSERT INTO push_settings 
        (customer_id, vapid_public_key, vapid_private_key, vapid_subject, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        customerId, 
        vapidKeys.publicKey, 
        vapidKeys.privateKey, 
        `mailto:${email}`,
        new Date(),
        new Date()
      ]);

      console.log('✅ VAPID keys generated');

      // Generate JWT token
      const token = jwt.sign(
        { user_id: userId, email, role: 'customer' },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      console.log('✅ Registration complete');

      res.status(201).json({
        message: 'Registration successful',
        token,
        user: {
          id: userId,
          email,
          role: 'customer',
          email_verified: false
        }
      });

    } catch (error) {
      console.error('❌ Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Logout endpoint (client-side token removal, but we can track this)
router.post('/logout', async (req, res) => {
  // In a more sophisticated setup, you might want to blacklist the token
  res.json({ message: 'Logout successful' });
});

// Password reset request
router.post('/forgot-password',
  authLimiter,
  body('email').isEmail().normalizeEmail(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      // Check if user exists
      const [users] = await query('SELECT id FROM users WHERE email = ?', [email]);
      
      // Always return success for security (don't reveal if email exists)
      if (users.length === 0) {
        return res.json({ message: 'If the email exists, a password reset link has been sent' });
      }

      // Generate reset token
      const resetToken = uuidv4();
      const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

      await query(
        'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
        [resetToken, resetTokenExpires, email]
      );

      // TODO: Send email with reset link
      console.log(`Password reset requested for ${email}, token: ${resetToken}`);

      res.json({ message: 'If the email exists, a password reset link has been sent' });

    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Password reset
router.post('/reset-password',
  body('token').isUUID(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token, password } = req.body;

      // Find user with valid reset token
      const [users] = await query(
        'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > ?',
        [token, new Date()]
      );

      if (users.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Update password and clear reset token
      await query(
        'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
        [passwordHash, users[0].id]
      );

      res.json({ message: 'Password reset successful' });

    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Email verification
router.post('/verify-email',
  body('token').isUUID(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token } = req.body;

      // Find user with verification token
      const [users] = await query('SELECT id FROM users WHERE verification_token = ?', [token]);

      if (users.length === 0) {
        return res.status(400).json({ error: 'Invalid verification token' });
      }

      // Mark email as verified
      await query(
        'UPDATE users SET email_verified = true, verification_token = NULL WHERE id = ?',
        [users[0].id]
      );

      res.json({ message: 'Email verified successfully' });

    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

module.exports = router;