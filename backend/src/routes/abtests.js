const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const webpush = require('web-push');
const { query } = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('customer'));

// Create AB test
router.post('/create',
  body('name').isString().notEmpty().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().isLength({ max: 500 }),
  body('control_variant').isObject(),
  body('test_variants').isArray().isLength({ min: 1, max: 5 }),
  body('traffic_split').optional().isObject(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Get customer
      const [customers] = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
      const customer = customers && customers.length > 0 ? customers[0] : null;
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Check if test name already exists
      const [existingTests] = await query(
        'SELECT id FROM ab_tests WHERE customer_id = ? AND name = ?',
        [customer.id, req.body.name]
      );
      
      if (existingTests.length > 0) {
        return res.status(409).json({ error: 'AB test with this name already exists' });
      }

      const testId = uuidv4();
      const abTest = {
        id: testId,
        customer_id: customer.id,
        name: req.body.name,
        description: req.body.description || '',
        status: 'draft',
        traffic_split: JSON.stringify(req.body.traffic_split || { control: 50 }),
        created_by: req.user.user_id,
        created_at: new Date(),
        updated_at: new Date()
      };

      await query(`
        INSERT INTO ab_tests 
        (id, customer_id, name, description, status, traffic_split, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        abTest.id, abTest.customer_id, abTest.name, abTest.description,
        abTest.status, abTest.traffic_split, abTest.created_by,
        abTest.created_at, abTest.updated_at
      ]);

      // Create control variant
      const controlId = uuidv4();
      await query(`
        INSERT INTO ab_test_variants 
        (id, test_id, name, type, content, created_at, updated_at)
        VALUES (?, ?, 'Control', 'control', ?, ?, ?)
      `, [controlId, testId, JSON.stringify(req.body.control_variant), new Date(), new Date()]);

      // Create test variants
      for (const [index, variant] of req.body.test_variants.entries()) {
        const variantId = uuidv4();
        await query(`
          INSERT INTO ab_test_variants 
          (id, test_id, name, type, content, created_at, updated_at)
          VALUES (?, ?, ?, 'test', ?, ?, ?)
        `, [variantId, testId, variant.name || `Variant ${index + 1}`, JSON.stringify(variant), new Date(), new Date()]);
      }

      res.status(201).json({
        message: 'AB test created successfully',
        ab_test: { ...abTest, traffic_split: JSON.parse(abTest.traffic_split) }
      });

    } catch (error) {
      console.error('AB test creation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get AB tests
router.get('/list', async (req, res) => {
  try {
    const { status } = req.query;

    // Get customer
    const [customers] = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
    const customer = customers && customers.length > 0 ? customers[0] : null;
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    let sqlQuery = `
      SELECT at.*, c.name as customer_name
      FROM ab_tests at
      JOIN customers c ON at.customer_id = c.id
      WHERE at.customer_id = ?
    `;
    let params = [customer.id];

    if (status) {
      sqlQuery += ' AND at.status = ?';
      params.push(status);
    }

    sqlQuery += ' ORDER BY at.created_at DESC';

    const [tests] = await query(sqlQuery, params);

    // Get variants for each test
    const testsWithVariants = await Promise.all(
      tests.map(async (test) => {
        const [variants] = await query('SELECT * FROM ab_test_variants WHERE test_id = ?', [test.id]);
        return {
          ...test,
          traffic_split: JSON.parse(test.traffic_split),
          variants: variants.map(v => ({ ...v, content: JSON.parse(v.content) }))
        };
      })
    );

    res.json({
      ab_tests: testsWithVariants,
      total: tests.length
    });

  } catch (error) {
    console.error('AB tests list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send notification with AB test
router.post('/:id/send',
  body('segment_id').optional().isUUID(),
  async (req, res) => {
    try {
      // Get customer
      const [customers] = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
      const customer = customers && customers.length > 0 ? customers[0] : null;
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Get AB test
      const [tests] = await query(
        'SELECT * FROM ab_tests WHERE id = ? AND customer_id = ?',
        [req.params.id, customer.id]
      );

      if (tests.length === 0) {
        return res.status(404).json({ error: 'AB test not found' });
      }

      const test = tests[0];
      if (test.status !== 'running') {
        return res.status(400).json({ error: 'AB test must be running to send notifications' });
      }

      // Get push settings
      const [settings] = await query('SELECT * FROM push_settings WHERE customer_id = ?', [customer.id]);
      if (!settings || !settings[0]) {
        return res.status(400).json({ error: 'Push notifications not configured' });
      }

      // Get active subscriptions
      const [subscriptions] = await query(
        'SELECT * FROM push_subscriptions WHERE customer_id = ? AND status = "active"',
        [customer.id]
      );

      if (subscriptions.length === 0) {
        return res.json({ sent: 0, failed: 0, message: 'No active subscriptions found' });
      }

      // Get test variants
      const [variants] = await query('SELECT * FROM ab_test_variants WHERE test_id = ?', [test.id]);

      webpush.setVapidDetails(
        settings[0].vapid_subject,
        settings[0].vapid_public_key,
        settings[0].vapid_private_key
      );

      let sent = 0;
      let failed = 0;

      // Distribute traffic between variants
      const trafficSplit = JSON.parse(test.traffic_split);
      
      for (const subscription of subscriptions) {
        // Simple variant assignment (can be made more sophisticated)
        const hash = subscription.id.slice(-2);
        const hashNum = parseInt(hash, 16);
        const variantIndex = hashNum % variants.length;
        const variant = variants[variantIndex];

        const content = JSON.parse(variant.content);
        const payload = {
          title: content.title,
          body: content.body,
          url: content.url || '/',
          icon: content.icon || '/icon.png',
          tag: `abtest-${test.id}`
        };

        try {
          await webpush.sendNotification({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh_key,
              auth: subscription.auth_key
            }
          }, JSON.stringify(payload));

          // Record participant
          await query(`
            INSERT IGNORE INTO ab_test_participants 
            (test_id, variant_id, subscription_id, assigned_at)
            VALUES (?, ?, ?, ?)
          `, [test.id, variant.id, subscription.id, new Date()]);

          sent++;
        } catch (error) {
          console.error('Failed to send AB test notification:', error);
          failed++;
        }
      }

      // Record notification
      const notificationId = uuidv4();
      await query(`
        INSERT INTO notifications 
        (id, customer_id, ab_test_id, title, body, status, sent_count, failed_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'sent', ?, ?, ?, ?)
      `, [
        notificationId, customer.id, test.id, 'AB Test Notification',
        `Testing ${variants.length} variants`, sent, failed, new Date(), new Date()
      ]);

      res.json({ 
        sent, 
        failed, 
        message: `AB test notification sent to ${sent} subscribers across ${variants.length} variants` 
      });

    } catch (error) {
      console.error('AB test send error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

module.exports = router;