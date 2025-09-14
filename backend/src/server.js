const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables if present
dotenv.config();

const { testConnection } = require('./config/database');
const SetupManager = require('./setup');
const { getDatastores, seedAdminIfMissing } = require('./storage/datastores');
const { apiLimiter } = require('./middleware/rateLimiter');
const { getScheduler } = require('./services/scheduler');
const { getCampaignExecutor } = require('./services/campaignExecutor');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const customerRoutes = require('./routes/customer');
const publicRoutes = require('./routes/public');
const metricsRoutes = require('./routes/metrics');
const scheduledRoutes = require('./routes/scheduled');
const templatesRoutes = require('./routes/templates');
const segmentsRoutes = require('./routes/segments');
const { router: webhooksRoutes } = require('./routes/webhooks');
const abTestsRoutes = require('./routes/abtests');
const campaignsRoutes = require('./routes/campaigns');

const app = express();

// Trust proxy for rate limiting to work correctly behind reverse proxies
app.set('trust proxy', true);

// Debug ALL requests
app.use((req, res, next) => {
  console.log('=== REQUEST DEBUG ===');
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Content-Type:', req.headers['content-type']);
  next();
});

// CORS configuration - allow all origins for push notification service
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all origins since this is a push notification service
    // that needs to work from any website
    return callback(null, true);
  },
  credentials: true, // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // Cache preflight requests for 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Apply general rate limiting to all API routes
// app.use('/api/', apiLimiter); // TODO: Re-enable rate limiting later

// Initialize storage (MySQL or in-memory)
const USE_MEMORY = String(process.env.USE_MEMORY_STORE || 'false').toLowerCase() === 'true';

async function initializeStorage() {
  if (USE_MEMORY) {
    console.log('🧪 Memory mode: skipping DB setup/migrations');
    // Initialize in-memory stores and seed minimal data
    await seedAdminIfMissing();
    return;
  }

  // Check if database is set up, if not run setup automatically
  try {
    const setup = new SetupManager();
    const status = await setup.checkSetupStatus();
    if (!status.setup) {
      console.log(`🔧 Database not set up: ${status.reason}`);
      console.log('🚀 Running automatic setup...');
      await setup.setupDatabase();
    } else {
      console.log('✅ Database already set up');
      getDatastores();
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

// Initialize storage on startup
initializeStorage();

// Initialize notification scheduler only when using MySQL
if (!USE_MEMORY) {
  getScheduler();
}

// Serve SDK files with CORS headers
app.get('/sdk.js', (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.type('application/javascript');
  res.send(fs.readFileSync(path.join(__dirname, 'sdk', 'snippet.js'), 'utf-8'));
});
app.get('/pn-sw.js', (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.type('application/javascript');
  res.send(fs.readFileSync(path.join(__dirname, 'sdk', 'service-worker.js'), 'utf-8'));
});

// Serve downloadable service worker file for users (BEFORE static middleware)
app.get('/download/pn-sw.js', (_req, res) => {
  const serviceWorkerContent = `// Push Notification Service Worker
// Save this file as 'pn-sw.js' at your website root (same folder as index.html)

// Import the full push notification service worker from the server
importScripts('${process.env.CDN_BASE || 'https://pushads123.com'}/pn-sw.js');

// Optional: Add your own service worker logic here
// This file runs in the background and handles push notifications

console.log('Push notification service worker loaded');`;
  
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Content-Disposition', 'attachment; filename="pn-sw.js"');
  res.send(serviceWorkerContent);
});

// Serve static admin/customer UI with CORS headers
app.use(express.static(path.join(__dirname, '..', 'public'), {
  setHeaders: (res, path) => {
    // Add CORS headers for all static files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    // Set appropriate cache headers for different file types
    if (path.endsWith('.js')) {
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache for JS files
    } else if (path.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache for CSS files
    } else if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache'); // No cache for HTML files
    }
  }
}));

// Pretty UI demo page provided by user
app.get('/notifypro', (_req, res) => {
  res.type('text/html');
  res.send(fs.readFileSync(path.join(__dirname, '..', 'public', 'notifypro.html'), 'utf-8'));
});

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Test route for debugging
app.post('/api/test', (req, res) => {
  console.log('Test route hit with body:', req.body);
  res.json({ message: 'Test successful', body: req.body });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/scheduled', scheduledRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/segments', segmentsRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/abtests', abTestsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api', publicRoutes);
app.use('/api/metrics', metricsRoutes);

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Error occurred:', err?.message || 'Unknown error');
  if (err?.stack) {
    console.error('Stack trace:', err.stack);
  }
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Push Notification Service running on http://localhost:${PORT}`);
  
  // Start campaign executor
  const campaignExecutor = getCampaignExecutor();
  campaignExecutor.start();
});

