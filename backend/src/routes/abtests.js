const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const webpush = require('web-push');
const { getDatastores } = require('../storage/datastores');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('customer'));

// Create new A/B test
router.post(
  '/create',
  body('name').isString().notEmpty().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().isLength({ max: 500 }),
  body('hypothesis').optional().isString().isLength({ max: 1000 }),
  body('variants').isArray({ min: 2, max: 10 }),
  body('variants.*.name').isString().notEmpty(),
  body('variants.*.title').isString().notEmpty(),
  body('variants.*.body').isString().notEmpty(),
  body('variants.*.url').optional().isURL(),
  body('variants.*.image').optional().isURL(),
  body('variants.*.icon').optional().isURL(),
  body('variants.*.badge').optional().isURL(),
  body('variants.*.tag').optional().isString(),
  body('variants.*.traffic').isFloat({ min: 0, max: 100 }),
  body('variants.*.isControl').optional().isBoolean(),
  body('targetSegment').optional().isString(),
  body('testDuration').isInt({ min: 1, max: 30 }),
  body('successMetric').isIn(['open_rate', 'click_rate', 'conversion_rate', 'engagement_score']),
  body('minSampleSize').optional().isInt({ min: 100 }),
  body('confidenceLevel').optional().isFloat({ min: 80, max: 99 }),
  body('expectedLift').optional().isFloat({ min: 1, max: 100 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { customers, abTests } = getDatastores();
      const customer = await customers.findOne({ user_id: req.user.userId });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Validate traffic allocation adds up to 100%
      const totalTraffic = req.body.variants.reduce((sum, variant) => sum + variant.traffic, 0);
      if (Math.abs(totalTraffic - 100) > 0.01) {
        return res.status(400).json({ error: 'Variant traffic allocation must sum to 100%' });
      }

      // Ensure exactly one control variant
      const controlCount = req.body.variants.filter(v => v.isControl).length;
      if (controlCount === 0) {
        req.body.variants[0].isControl = true; // Make first variant control if none specified
      } else if (controlCount > 1) {
        return res.status(400).json({ error: 'Only one variant can be marked as control' });
      }

      // Check for name conflicts
      const existingTest = await abTests.findOne({
        customer_id: customer.id,
        name: req.body.name,
        status: { $in: ['draft', 'running', 'paused'] }
      });
      
      if (existingTest) {
        return res.status(409).json({ error: 'An active A/B test with this name already exists' });
      }

      const test = {
        customer_id: customer.id,
        name: req.body.name,
        description: req.body.description || '',
        hypothesis: req.body.hypothesis || '',
        metric: req.body.successMetric,
        traffic_split: 50, // Default, will be calculated from variants
        target_segment_id: req.body.targetSegment || null,
        min_sample_size: req.body.minSampleSize || 100,
        confidence_level: req.body.confidenceLevel || 95.00,
        expected_lift: req.body.expectedLift || 10.00,
        duration_days: req.body.testDuration,
        start_date: null,
        end_date: null,
        winner_variant_id: null,
        statistical_significance: false,
        confidence_interval: null,
        status: 'draft',
        created_by: req.user.userId,
        created_at: new Date(),
        updated_at: new Date()
      };

      const insertedTest = await abTests.insert(test);

      // Create variants
      const { abTestVariants } = getDatastores();
      const variants = [];
      
      for (const [index, variantData] of req.body.variants.entries()) {
        const variant = {
          test_id: insertedTest.id,
          name: variantData.name,
          is_control: variantData.isControl || index === 0,
          traffic_percentage: variantData.traffic,
          template_id: null, // Could link to notification templates
          notification_data: JSON.stringify({
            title: variantData.title,
            body: variantData.body,
            url: variantData.url,
            image: variantData.image,
            icon: variantData.icon,
            badge: variantData.badge,
            tag: variantData.tag
          }),
          participant_count: 0,
          sent_count: 0,
          delivered_count: 0,
          opened_count: 0,
          clicked_count: 0,
          conversion_count: 0,
          open_rate: 0.00,
          click_rate: 0.00,
          conversion_rate: 0.00,
          engagement_score: 0.00,
          created_at: new Date(),
          updated_at: new Date()
        };

        const insertedVariant = await abTestVariants.insert(variant);
        variants.push(insertedVariant);
      }

      res.status(201).json({
        test: {
          ...insertedTest,
          variants
        },
        message: 'A/B test created successfully'
      });
    } catch (error) {
      console.error('A/B test creation error:', error);
      res.status(500).json({ error: 'Failed to create A/B test' });
    }
  }
);

// List A/B tests for customer
router.get('/list', async (req, res) => {
  try {
    const { customers, abTests, abTestVariants } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const status = req.query.status;
    let query = { customer_id: customer.id };
    if (status && ['draft', 'running', 'completed', 'paused', 'cancelled'].includes(status)) {
      query.status = status;
    }

    const tests = await abTests.find(query, { sort: { created_at: -1 } });
    
    // Enrich with variant information
    for (const test of tests) {
      test.variants = await abTestVariants.find({ test_id: test.id });
      test.variant_count = test.variants.length;
      
      // Calculate test statistics
      if (test.status === 'running') {
        const totalParticipants = test.variants.reduce((sum, v) => sum + v.participant_count, 0);
        const totalSent = test.variants.reduce((sum, v) => sum + v.sent_count, 0);
        const totalOpened = test.variants.reduce((sum, v) => sum + v.opened_count, 0);
        const totalClicked = test.variants.reduce((sum, v) => sum + v.clicked_count, 0);
        
        test.total_participants = totalParticipants;
        test.total_sent = totalSent;
        test.overall_open_rate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(2) : 0;
        test.overall_click_rate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(2) : 0;
      }
    }

    res.json({ 
      tests,
      total: tests.length 
    });
  } catch (error) {
    console.error('A/B test list error:', error);
    res.status(500).json({ error: 'Failed to fetch A/B tests' });
  }
});

// Get specific A/B test with detailed analytics
router.get('/:testId', async (req, res) => {
  try {
    const { customers, abTests, abTestVariants, abTestParticipants, metrics } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const test = await abTests.findOne({ 
      id: req.params.testId, 
      customer_id: customer.id 
    });
    
    if (!test) {
      return res.status(404).json({ error: 'A/B test not found' });
    }

    // Get variants with latest metrics
    const variants = await abTestVariants.find({ test_id: test.id });
    
    // Enrich variants with real-time metrics if test is running
    if (test.status === 'running') {
      for (const variant of variants) {
        // Get participant count
        const participantCount = await abTestParticipants.count({
          test_id: test.id,
          variant_id: variant.id
        });
        
        // Get metrics from metrics table
        const opens = await metrics.count({
          customer_id: customer.id,
          event_type: 'opened',
          ab_test_id: test.id
        });
        
        const clicks = await metrics.count({
          customer_id: customer.id,
          event_type: 'clicked',
          ab_test_id: test.id
        });
        
        // Update variant stats
        variant.participant_count = participantCount;
        variant.opened_count = opens;
        variant.clicked_count = clicks;
        
        // Calculate rates
        if (variant.sent_count > 0) {
          variant.open_rate = ((variant.opened_count / variant.sent_count) * 100).toFixed(2);
          variant.click_rate = ((variant.clicked_count / variant.sent_count) * 100).toFixed(2);
          variant.conversion_rate = ((variant.conversion_count / variant.sent_count) * 100).toFixed(2);
        }

        // Parse notification data
        variant.notification_data = JSON.parse(variant.notification_data);
      }

      // Calculate statistical significance
      test.statistical_significance = calculateStatisticalSignificance(variants, test.metric);
      
      // Determine current leader
      const leader = determineLeader(variants, test.metric);
      test.current_leader = leader ? {
        variant_id: leader.id,
        variant_name: leader.name,
        metric_value: getMetricValue(leader, test.metric),
        confidence: test.statistical_significance
      } : null;
    }

    // Get recent participant activity (last 7 days)
    if (test.status === 'running') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentParticipants = await abTestParticipants.find({
        test_id: test.id,
        joined_at: { $gte: sevenDaysAgo }
      });
      
      test.recent_participants = recentParticipants.length;
      test.daily_participation_rate = (recentParticipants.length / 7).toFixed(1);
    }

    res.json({
      ...test,
      variants
    });
  } catch (error) {
    console.error('A/B test get error:', error);
    res.status(500).json({ error: 'Failed to fetch A/B test' });
  }
});

// Start A/B test
router.post('/:testId/start', async (req, res) => {
  try {
    const { customers, abTests, abTestVariants, subscriptions, pushSettings } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const test = await abTests.findOne({ 
      id: req.params.testId, 
      customer_id: customer.id 
    });
    
    if (!test) {
      return res.status(404).json({ error: 'A/B test not found' });
    }

    if (test.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft tests can be started' });
    }

    // Get variants
    const variants = await abTestVariants.find({ test_id: test.id });
    if (variants.length < 2) {
      return res.status(400).json({ error: 'A/B test must have at least 2 variants' });
    }

    // Get target subscribers
    let subscribers;
    if (test.target_segment_id) {
      // TODO: Implement segment filtering based on segment conditions
      const { userSegments } = getDatastores();
      const segment = await userSegments.findOne({ id: test.target_segment_id });
      if (segment) {
        // Apply segment conditions to filter subscribers
        subscribers = await subscriptions.find({ customer_id: customer.id });
        // TODO: Apply segment filtering logic here
      } else {
        subscribers = await subscriptions.find({ customer_id: customer.id });
      }
    } else {
      subscribers = await subscriptions.find({ customer_id: customer.id });
    }

    if (subscribers.length === 0) {
      return res.status(400).json({ error: 'No subscribers found for the target segment' });
    }

    // Check minimum sample size
    if (subscribers.length < test.min_sample_size) {
      return res.status(400).json({ 
        error: `Insufficient sample size. Need at least ${test.min_sample_size} subscribers, but only ${subscribers.length} available.` 
      });
    }

    // Get VAPID settings
    const settings = await pushSettings.findOne({ customer_id: customer.id });
    const vapidPublicKey = settings?.vapidPublicKey || process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = settings?.vapidPrivateKey || process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = settings?.vapidSubject || process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

    if (!vapidPublicKey || !vapidPrivateKey) {
      return res.status(400).json({ error: 'Missing VAPID keys. Please configure push settings first.' });
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    // Randomly assign subscribers to variants based on traffic allocation
    const variantAssignments = assignSubscribersToVariants(subscribers, variants);
    
    // Send notifications to each variant group
    const results = [];
    const { abTestParticipants } = getDatastores();

    for (const variant of variants) {
      const assignedSubs = variantAssignments[variant.id] || [];
      if (assignedSubs.length === 0) continue;

      const notificationData = JSON.parse(variant.notification_data);
      const payload = JSON.stringify({
        title: notificationData.title,
        body: notificationData.body,
        url: notificationData.url,
        image: notificationData.image,
        icon: notificationData.icon || settings?.iconUrl,
        badge: notificationData.badge || settings?.badgeUrl,
        tag: notificationData.tag,
        data: {
          abTestId: test.id,
          variantId: variant.id,
          customerId: customer.id
        }
      });

      let sent = 0;
      let failed = 0;

      for (const subscription of assignedSubs) {
        try {
          const subscriptionData = JSON.parse(subscription.subscription);
          const pushSubscription = {
            endpoint: subscriptionData.endpoint,
            keys: {
              p256dh: subscriptionData.keys.p256dh,
              auth: subscriptionData.keys.auth
            }
          };

          await webpush.sendNotification(pushSubscription, payload);
          sent++;

          // Record participant
          await abTestParticipants.insert({
            test_id: test.id,
            variant_id: variant.id,
            subscription_id: subscription.id,
            notification_id: null, // Will be set when notification record is created
            joined_at: new Date(),
            converted_at: null,
            conversion_value: 0.00
          });

        } catch (error) {
          failed++;
          console.error('Push send error:', error);
          
          // Remove invalid subscriptions
          if (error.statusCode === 410 || error.statusCode === 404) {
            await subscriptions.remove({ id: subscription.id });
          }
        }
      }

      results.push({
        variantId: variant.id,
        variantName: variant.name,
        sent,
        failed,
        total: assignedSubs.length
      });

      // Update variant stats
      await abTestVariants.update({ id: variant.id }, {
        $set: {
          participant_count: assignedSubs.length,
          sent_count: assignedSubs.length,
          delivered_count: sent,
          updated_at: new Date()
        }
      });
    }

    // Update test status and start time
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + test.duration_days);

    await abTests.update({ id: test.id }, {
      $set: {
        status: 'running',
        start_date: new Date(),
        end_date: endDate,
        updated_at: new Date()
      }
    });

    res.json({
      message: 'A/B test started successfully',
      testId: test.id,
      results,
      totalParticipants: results.reduce((sum, r) => sum + r.total, 0),
      scheduledEndDate: endDate.toISOString()
    });
  } catch (error) {
    console.error('A/B test start error:', error);
    res.status(500).json({ error: 'Failed to start A/B test' });
  }
});

// Pause A/B test
router.post('/:testId/pause', async (req, res) => {
  try {
    const { customers, abTests } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const test = await abTests.findOne({ 
      id: req.params.testId, 
      customer_id: customer.id 
    });
    
    if (!test) {
      return res.status(404).json({ error: 'A/B test not found' });
    }

    if (test.status !== 'running') {
      return res.status(400).json({ error: 'Only running tests can be paused' });
    }

    await abTests.update({ id: test.id }, {
      $set: {
        status: 'paused',
        updated_at: new Date()
      }
    });

    res.json({ message: 'A/B test paused successfully' });
  } catch (error) {
    console.error('A/B test pause error:', error);
    res.status(500).json({ error: 'Failed to pause A/B test' });
  }
});

// Resume A/B test
router.post('/:testId/resume', async (req, res) => {
  try {
    const { customers, abTests } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const test = await abTests.findOne({ 
      id: req.params.testId, 
      customer_id: customer.id 
    });
    
    if (!test) {
      return res.status(404).json({ error: 'A/B test not found' });
    }

    if (test.status !== 'paused') {
      return res.status(400).json({ error: 'Only paused tests can be resumed' });
    }

    await abTests.update({ id: test.id }, {
      $set: {
        status: 'running',
        updated_at: new Date()
      }
    });

    res.json({ message: 'A/B test resumed successfully' });
  } catch (error) {
    console.error('A/B test resume error:', error);
    res.status(500).json({ error: 'Failed to resume A/B test' });
  }
});

// Stop A/B test and declare winner
router.post('/:testId/stop', async (req, res) => {
  try {
    const { customers, abTests, abTestVariants } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const test = await abTests.findOne({ 
      id: req.params.testId, 
      customer_id: customer.id 
    });
    
    if (!test) {
      return res.status(404).json({ error: 'A/B test not found' });
    }

    if (test.status !== 'running' && test.status !== 'paused') {
      return res.status(400).json({ error: 'Only running or paused tests can be stopped' });
    }

    // Get current variant performance
    const variants = await abTestVariants.find({ test_id: test.id });
    
    // Calculate final metrics for all variants
    for (const variant of variants) {
      if (variant.sent_count > 0) {
        variant.open_rate = ((variant.opened_count / variant.sent_count) * 100).toFixed(2);
        variant.click_rate = ((variant.clicked_count / variant.sent_count) * 100).toFixed(2);
        variant.conversion_rate = ((variant.conversion_count / variant.sent_count) * 100).toFixed(2);
        
        await abTestVariants.update({ id: variant.id }, {
          $set: {
            open_rate: variant.open_rate,
            click_rate: variant.click_rate,
            conversion_rate: variant.conversion_rate,
            updated_at: new Date()
          }
        });
      }
    }

    // Determine winner
    const winner = determineWinner(variants, test.metric);
    const statisticalSignificance = calculateStatisticalSignificance(variants, test.metric);
    
    await abTests.update({ id: test.id }, {
      $set: {
        status: 'completed',
        end_date: new Date(),
        winner_variant_id: winner ? winner.id : null,
        statistical_significance: statisticalSignificance >= test.confidence_level,
        confidence_interval: JSON.stringify({
          confidence: statisticalSignificance,
          winner_performance: winner ? getMetricValue(winner, test.metric) : 0,
          control_performance: variants.find(v => v.is_control) ? getMetricValue(variants.find(v => v.is_control), test.metric) : 0
        }),
        updated_at: new Date()
      }
    });

    res.json({
      message: 'A/B test completed successfully',
      winner: winner ? {
        variantId: winner.id,
        variantName: winner.name,
        metric: test.metric,
        value: getMetricValue(winner, test.metric),
        confidence: statisticalSignificance,
        isSignificant: statisticalSignificance >= test.confidence_level
      } : null,
      summary: {
        totalParticipants: variants.reduce((sum, v) => sum + v.participant_count, 0),
        totalSent: variants.reduce((sum, v) => sum + v.sent_count, 0),
        totalOpened: variants.reduce((sum, v) => sum + v.opened_count, 0),
        totalClicked: variants.reduce((sum, v) => sum + v.clicked_count, 0),
        testDuration: Math.ceil((new Date() - new Date(test.start_date)) / (1000 * 60 * 60 * 24)),
        statisticalSignificance: statisticalSignificance
      }
    });
  } catch (error) {
    console.error('A/B test stop error:', error);
    res.status(500).json({ error: 'Failed to stop A/B test' });
  }
});

// Delete A/B test (only draft tests)
router.delete('/:testId', async (req, res) => {
  try {
    const { customers, abTests, abTestVariants } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const test = await abTests.findOne({ 
      id: req.params.testId, 
      customer_id: customer.id 
    });
    
    if (!test) {
      return res.status(404).json({ error: 'A/B test not found' });
    }

    if (test.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft tests can be deleted' });
    }

    // Delete variants first
    await abTestVariants.remove({ test_id: test.id });
    
    // Delete test
    await abTests.remove({ id: test.id });
    
    res.json({ message: 'A/B test deleted successfully' });
  } catch (error) {
    console.error('A/B test delete error:', error);
    res.status(500).json({ error: 'Failed to delete A/B test' });
  }
});

// Get A/B test analytics and insights
router.get('/:testId/analytics', async (req, res) => {
  try {
    const { customers, abTests, abTestVariants, abTestParticipants, metrics } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const test = await abTests.findOne({ 
      id: req.params.testId, 
      customer_id: customer.id 
    });
    
    if (!test) {
      return res.status(404).json({ error: 'A/B test not found' });
    }

    const variants = await abTestVariants.find({ test_id: test.id });

    // Get time-series data for the last 7 days
    const analytics = {
      variants: [],
      timeline: [],
      insights: [],
      statistical_analysis: {}
    };

    // Variant performance breakdown
    for (const variant of variants) {
      const variantAnalytics = {
        id: variant.id,
        name: variant.name,
        is_control: variant.is_control,
        participant_count: variant.participant_count,
        sent_count: variant.sent_count,
        delivered_count: variant.delivered_count,
        opened_count: variant.opened_count,
        clicked_count: variant.clicked_count,
        conversion_count: variant.conversion_count,
        open_rate: parseFloat(variant.open_rate),
        click_rate: parseFloat(variant.click_rate),
        conversion_rate: parseFloat(variant.conversion_rate),
        engagement_score: parseFloat(variant.engagement_score)
      };

      analytics.variants.push(variantAnalytics);
    }

    // Statistical analysis
    if (test.status === 'completed' || test.status === 'running') {
      const control = variants.find(v => v.is_control);
      const treatments = variants.filter(v => !v.is_control);
      
      analytics.statistical_analysis = {
        confidence_level: test.confidence_level,
        statistical_significance: calculateStatisticalSignificance(variants, test.metric),
        control_performance: control ? getMetricValue(control, test.metric) : 0,
        best_treatment_performance: treatments.length > 0 ? Math.max(...treatments.map(t => getMetricValue(t, test.metric))) : 0,
        sample_size_adequate: variants.every(v => v.participant_count >= test.min_sample_size / variants.length)
      };

      // Generate insights
      if (control && treatments.length > 0) {
        const bestTreatment = treatments.reduce((best, current) => 
          getMetricValue(current, test.metric) > getMetricValue(best, test.metric) ? current : best
        );

        const improvement = ((getMetricValue(bestTreatment, test.metric) - getMetricValue(control, test.metric)) / getMetricValue(control, test.metric)) * 100;
        
        analytics.insights.push({
          type: 'performance',
          message: `Best performing variant "${bestTreatment.name}" shows ${improvement.toFixed(1)}% ${improvement > 0 ? 'improvement' : 'decrease'} over control`,
          impact: improvement > 10 ? 'high' : improvement > 5 ? 'medium' : 'low'
        });

        if (analytics.statistical_analysis.statistical_significance >= test.confidence_level) {
          analytics.insights.push({
            type: 'significance',
            message: `Results are statistically significant at ${analytics.statistical_analysis.statistical_significance}% confidence`,
            impact: 'high'
          });
        } else {
          analytics.insights.push({
            type: 'significance', 
            message: `Results are not yet statistically significant. Consider running the test longer.`,
            impact: 'medium'
          });
        }
      }
    }

    res.json(analytics);
  } catch (error) {
    console.error('A/B test analytics error:', error);
    res.status(500).json({ error: 'Failed to get A/B test analytics' });
  }
});

// Helper functions
function assignSubscribersToVariants(subscribers, variants) {
  const assignments = {};
  variants.forEach(variant => {
    assignments[variant.id] = [];
  });

  // Calculate cumulative traffic percentages
  let cumulative = 0;
  const cumulativeVariants = variants.map(variant => {
    cumulative += variant.traffic_percentage;
    return { ...variant, cumulativeTraffic: cumulative };
  });

  // Shuffle subscribers for randomness
  const shuffledSubscribers = [...subscribers].sort(() => Math.random() - 0.5);

  // Assign each subscriber to a variant
  shuffledSubscribers.forEach(subscriber => {
    const randomValue = Math.random() * 100;
    
    for (const variant of cumulativeVariants) {
      if (randomValue <= variant.cumulativeTraffic) {
        assignments[variant.id].push(subscriber);
        break;
      }
    }
  });

  return assignments;
}

function determineWinner(variants, successMetric) {
  return variants.reduce((winner, current) => {
    const winnerValue = getMetricValue(winner, successMetric);
    const currentValue = getMetricValue(current, successMetric);
    return currentValue > winnerValue ? current : winner;
  });
}

function determineLeader(variants, successMetric) {
  if (!variants || variants.length === 0) return null;
  return determineWinner(variants, successMetric);
}

function getMetricValue(variant, metric) {
  switch (metric) {
    case 'open_rate':
      return parseFloat(variant.open_rate) || 0;
    case 'click_rate':
      return parseFloat(variant.click_rate) || 0;
    case 'conversion_rate':
      return parseFloat(variant.conversion_rate) || 0;
    case 'engagement_score':
      return parseFloat(variant.engagement_score) || 0;
    default:
      return 0;
  }
}

function calculateStatisticalSignificance(variants, successMetric) {
  if (variants.length < 2) return 0;
  
  const control = variants.find(v => v.is_control) || variants[0];
  const treatments = variants.filter(v => !v.is_control);
  
  if (treatments.length === 0) return 0;
  
  const bestTreatment = treatments.reduce((best, current) => 
    getMetricValue(current, successMetric) > getMetricValue(best, successMetric) ? current : best
  );
  
  const controlValue = getMetricValue(control, successMetric) / 100; // Convert percentage to decimal
  const treatmentValue = getMetricValue(bestTreatment, successMetric) / 100;
  
  // Check minimum sample sizes
  const controlSample = control.sent_count || 0;
  const treatmentSample = bestTreatment.sent_count || 0;
  
  if (controlSample < 30 || treatmentSample < 30) return 0;
  
  // Simplified z-test for proportions
  const pooledProportion = ((controlValue * controlSample) + (treatmentValue * treatmentSample)) / (controlSample + treatmentSample);
  const standardError = Math.sqrt(pooledProportion * (1 - pooledProportion) * ((1 / controlSample) + (1 / treatmentSample)));
  
  if (standardError === 0) return 0;
  
  const zScore = Math.abs(treatmentValue - controlValue) / standardError;
  
  // Convert z-score to confidence level (simplified)
  if (zScore >= 2.576) return 99; // 99% confidence
  if (zScore >= 1.96) return 95;  // 95% confidence
  if (zScore >= 1.645) return 90; // 90% confidence
  if (zScore >= 1.282) return 80; // 80% confidence
  
  return Math.round(Math.min(79, zScore * 40)); // Rough approximation for lower confidence levels
}

module.exports = router;