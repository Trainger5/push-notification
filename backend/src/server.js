const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables if present
dotenv.config();

const { getDatastores, seedAdminIfMissing } = require('./storage/datastores');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const customerRoutes = require('./routes/customer');
const publicRoutes = require('./routes/public');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize datastores and seed admin
getDatastores();
seedAdminIfMissing().catch((err) => {
  console.error('Failed to seed admin user:', err);
});

// Serve SDK files
app.get('/sdk.js', (_req, res) => {
  res.type('application/javascript');
  res.send(fs.readFileSync(path.join(__dirname, 'sdk', 'snippet.js'), 'utf-8'));
});
app.get('/pn-sw.js', (_req, res) => {
  res.type('application/javascript');
  res.send(fs.readFileSync(path.join(__dirname, 'sdk', 'service-worker.js'), 'utf-8'));
});

// Serve static admin/customer UI
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api', publicRoutes);

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Push Notification Service running on http://localhost:${PORT}`);
});


