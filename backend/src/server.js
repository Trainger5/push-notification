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

// Debug ALL requests
app.use((req, res, next) => {
  console.log('=== REQUEST DEBUG ===');
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Content-Type:', req.headers['content-type']);
  next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Apply general rate limiting to all API routes
// app.use('/api/', apiLimiter); // TODO: Re-enable rate limiting later

// Check if database is set up, if not run setup automatically
async function initializeDatabase() {
  try {
    const setup = new SetupManager();
    const status = await setup.checkSetupStatus();
    
    if (!status.setup) {
      console.log(`🔧 Database not set up: ${status.reason}`);
      console.log('🚀 Running automatic setup...');
      await setup.setupDatabase();
    } else {
      console.log('✅ Database already set up');
      // Initialize datastores
      getDatastores();
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

// Initialize database on startup
initializeDatabase();

// Initialize notification scheduler
getScheduler();

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


