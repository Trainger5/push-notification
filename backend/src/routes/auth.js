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
    const { users } = getDatastores();
    const user = await users.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
    res.json({ token, role: user.role, email: user.email });
  }
);

module.exports = router;


