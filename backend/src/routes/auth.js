const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatastores } = require('../storage/datastores');

const router = express.Router();

router.post(
  '/login',
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

module.exports = router;


