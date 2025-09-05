const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { getDatastores } = require('../storage/datastores');
const { requireAuth, requireRole } = require('../middleware/auth');
const webpush = require('web-push');

const router = express.Router();
router.use(requireAuth, requireRole('customer'));

// Create new drip campaign
router.post(
  '/create',
  body('name').isString().notEmpty().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().isLength({ max: 500 }),
  body('trigger').isObject(),
  body('trigger.type').isIn(['subscription', 'event', 'date', 'inactivity', 'segment_entry', 'behavior']),
  body('steps').isArray({ min: 1, max: 20 }),
  body('steps.*.type').isIn(['notification', 'wait', 'condition', 'segment_update', 'webhook']),
  body('targetSegment').optional().isString(),
  body('isActive').optional().isBoolean(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { customers, campaigns } = getDatastores();
      const customer = await customers.findOne({ user_id: req.user.user_id });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Check if campaign name already exists
      const existingCampaign = await campaigns.findOne({
        customer_id: customer.id,
        name: req.body.name
      });
      
      if (existingCampaign) {
        return res.status(409).json({ error: 'Campaign with this name already exists' });
      }

      // Validate steps
      const validatedSteps = await validateCampaignSteps(req.body.steps);
      if (!validatedSteps.valid) {
        return res.status(400).json({ error: validatedSteps.error });
      }

      const campaign = {
        customer_id: customer.id,
        name: req.body.name,
        description: req.body.description || '',
        type: 'drip', // Default type
        trigger_event: req.body.trigger.type,
        trigger_conditions: JSON.stringify(req.body.trigger),
        target_segment_id: req.body.targetSegment || null,
        steps: JSON.stringify(req.body.steps.map((step, index) => ({
          id: uuidv4(),
          order: index,
          ...step,
          created_at: new Date().toISOString()
        }))),
        total_steps: req.body.steps.length,
        entry_count: 0,
        active_count: 0,
        completed_count: 0,
        conversion_count: 0,
        revenue: 0.00,
        conversion_rate: 0.00,
        avg_time_to_convert: null,
        status: 'draft',
        started_at: null,
        paused_at: null,
        completed_at: null,
        created_by: req.user.user_id,
        created_at: new Date(),
        updated_at: new Date()
      };

      const newCampaign = await campaigns.insert(campaign);
      
      // Parse steps back for response
      const responseData = {
        ...newCampaign,
        trigger_conditions: JSON.parse(newCampaign.trigger_conditions),
        steps: JSON.parse(newCampaign.steps)
      };
      
      res.status(201).json({
        campaign: responseData,
        message: 'Campaign created successfully'
      });
    } catch (error) {
      console.error('Campaign creation error:', error);
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  }
);

// List all campaigns for customer
router.get('/list', async (req, res) => {
  try {
    const { customers, campaigns } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.user_id });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const status = req.query.status;
    let query = { customer_id: customer.id };
    if (status && ['draft', 'active', 'paused', 'completed', 'archived'].includes(status)) {
      query.status = status;
    }

    const campaignList = await campaigns.find(query, { sort: { created_at: -1 } });
    
    // Parse JSON fields for response
    const parsedCampaigns = campaignList.map(campaign => ({
      ...campaign,
      trigger_conditions: JSON.parse(campaign.trigger_conditions),
      steps: JSON.parse(campaign.steps)
    }));
    
    res.json({ 
      campaigns: parsedCampaigns,
      total: parsedCampaigns.length 
    });
  } catch (error) {
    console.error('Campaign list error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Get specific campaign details
router.get('/:campaignId', async (req, res) => {
  try {
    const { customers, campaigns, campaignExecutions } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.user_id });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const campaign = await campaigns.findOne({ 
      id: req.params.campaignId, 
      customer_id: customer.id 
    });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get recent executions for analytics
    const recentExecutions = await campaignExecutions.find({
      campaign_id: campaign.id
    }, { sort: { started_at: -1 }, limit: 100 });

    // Parse JSON fields
    const parsedCampaign = {
      ...campaign,
      trigger_conditions: JSON.parse(campaign.trigger_conditions),
      steps: JSON.parse(campaign.steps)
    };

    // Calculate step performance
    const stepPerformance = calculateStepPerformance(parsedCampaign.steps, recentExecutions);

    res.json({
      ...parsedCampaign,
      executions: recentExecutions,
      stepPerformance
    });
  } catch (error) {
    console.error('Campaign get error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// Start/activate campaign
router.post('/:campaignId/start', async (req, res) => {
  try {
    const { customers, campaigns } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.user_id });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const campaign = await campaigns.findOne({ 
      id: req.params.campaignId, 
      customer_id: customer.id 
    });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'draft' && campaign.status !== 'paused') {
      return res.status(400).json({ error: 'Can only start draft or paused campaigns' });
    }

    // Update campaign status
    await campaigns.update(
      { id: campaign.id },
      { 
        $set: { 
          status: 'active',
          started_at: new Date(),
          updated_at: new Date()
        } 
      }
    );

    // Initialize campaign monitoring
    await initializeCampaignMonitoring(campaign);

    res.json({ 
      message: 'Campaign started successfully', 
      campaignId: campaign.id 
    });
  } catch (error) {
    console.error('Campaign start error:', error);
    res.status(500).json({ error: 'Failed to start campaign' });
  }
});

// Pause campaign
router.post('/:campaignId/pause', async (req, res) => {
  try {
    const { customers, campaigns } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.user_id });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const campaign = await campaigns.findOne({ 
      id: req.params.campaignId, 
      customer_id: customer.id 
    });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    await campaigns.update(
      { id: campaign.id },
      { 
        $set: { 
          status: 'paused',
          paused_at: new Date(),
          updated_at: new Date()
        } 
      }
    );

    res.json({ message: 'Campaign paused successfully' });
  } catch (error) {
    console.error('Campaign pause error:', error);
    res.status(500).json({ error: 'Failed to pause campaign' });
  }
});

// Delete campaign
router.delete('/:campaignId', async (req, res) => {
  try {
    const { customers, campaigns, campaignExecutions } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.user_id });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const campaign = await campaigns.findOne({ 
      id: req.params.campaignId, 
      customer_id: customer.id 
    });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status === 'active') {
      return res.status(400).json({ error: 'Cannot delete active campaigns. Pause first.' });
    }

    // Delete campaign and related executions
    await campaigns.remove({ id: campaign.id });
    await campaignExecutions.remove({ campaign_id: campaign.id });

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Campaign delete error:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

// Process campaign triggers (webhook endpoint)
router.post('/trigger', async (req, res) => {
  try {
    const { eventType, user_id, eventData } = req.body;
    
    if (!eventType || !user_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await processCampaignTriggers(eventType, user_id, eventData);
    res.json({ message: 'Triggers processed successfully' });
  } catch (error) {
    console.error('Campaign trigger error:', error);
    res.status(500).json({ error: 'Failed to process triggers' });
  }
});

// Get campaign analytics
router.get('/:campaignId/analytics', async (req, res) => {
  try {
    const { customers, campaigns, campaignExecutions } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.user_id });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const campaign = await campaigns.findOne({ 
      id: req.params.campaignId, 
      customer_id: customer.id 
    });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const days = parseInt(req.query.days) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const executions = await campaignExecutions.find({
      campaign_id: campaign.id,
      started_at: { $gte: startDate }
    });

    const analytics = generateCampaignAnalytics(campaign, executions);
    res.json(analytics);
  } catch (error) {
    console.error('Campaign analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign analytics' });
  }
});

// Helper functions

async function validateCampaignSteps(steps) {
  try {
    for (const step of steps) {
      switch (step.type) {
        case 'notification':
          if (!step.title || !step.body) {
            return { valid: false, error: 'Notification steps must have title and body' };
          }
          break;
        case 'wait':
          if (!step.duration || !step.unit) {
            return { valid: false, error: 'Wait steps must have duration and unit' };
          }
          if (!['minutes', 'hours', 'days', 'weeks'].includes(step.unit)) {
            return { valid: false, error: 'Invalid wait unit' };
          }
          break;
        case 'condition':
          if (!step.condition || !step.condition.field) {
            return { valid: false, error: 'Condition steps must have valid conditions' };
          }
          break;
      }
    }
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid step configuration' };
  }
}

function calculateStepPerformance(steps, executions) {
  const stepStats = {};
  
  steps.forEach(step => {
    stepStats[step.id] = {
      stepId: step.id,
      type: step.type,
      name: step.name || `${step.type} Step`,
      entered: 0,
      completed: 0,
      failed: 0,
      avgDuration: 0,
      conversionRate: 0
    };
  });

  executions.forEach(execution => {
    const stepHistory = execution.step_history ? JSON.parse(execution.step_history) : [];
    stepHistory.forEach(stepExecution => {
      if (stepStats[stepExecution.stepId]) {
        stepStats[stepExecution.stepId].entered++;
        if (stepExecution.status === 'completed') {
          stepStats[stepExecution.stepId].completed++;
        } else if (stepExecution.status === 'failed') {
          stepStats[stepExecution.stepId].failed++;
        }
      }
    });
  });

  // Calculate conversion rates
  Object.values(stepStats).forEach(stat => {
    if (stat.entered > 0) {
      stat.conversionRate = ((stat.completed / stat.entered) * 100).toFixed(2);
    }
  });

  return Object.values(stepStats);
}

async function initializeCampaignMonitoring(campaign) {
  // This would set up triggers and monitoring for the campaign
  console.log(`Initializing monitoring for campaign: ${campaign.name}`);
  
  // Start the campaign executor if it's not already running
  const { getCampaignExecutor } = require('../services/campaignExecutor');
  const campaignExecutor = getCampaignExecutor();
  campaignExecutor.start();
}

async function processCampaignTriggers(eventType, user_id, eventData) {
  try {
    const { campaigns, campaignExecutions, subscriptions } = getDatastores();
    
    // Find active campaigns with matching triggers
    const activeCampaigns = await campaigns.find({
      status: 'active',
      trigger_event: eventType
    });

    for (const campaign of activeCampaigns) {
      // Check if user matches campaign criteria
      const userMatches = await checkUserMatchesCampaign(user_id, campaign);
      
      if (userMatches) {
        // Start campaign execution for this user
        await startCampaignExecution(campaign, user_id, eventData);
      }
    }
  } catch (error) {
    console.error('Process campaign triggers error:', error);
  }
}

async function checkUserMatchesCampaign(user_id, campaign) {
  try {
    const { subscriptions, userSegments } = getDatastores();
    
    // Get user subscription
    const user = await subscriptions.findOne({ id: user_id });
    if (!user || user.customer_id !== campaign.customer_id) {
      return false;
    }

    // Check segment targeting
    if (campaign.target_segment_id) {
      const segment = await userSegments.findOne({ id: campaign.target_segment_id });
      if (segment) {
        // In a real implementation, you'd evaluate segment conditions here
        return true; // Simplified for now
      }
    }

    return true;
  } catch (error) {
    console.error('Check user matches campaign error:', error);
    return false;
  }
}

async function startCampaignExecution(campaign, user_id, eventData) {
  try {
    const { campaignExecutions } = getDatastores();
    
    // Check if user already has an active execution for this campaign
    const existingExecution = await campaignExecutions.findOne({
      campaign_id: campaign.id,
      subscription_id: user_id,
      status: { $in: ['active', 'waiting'] }
    });

    if (existingExecution) {
      console.log(`User ${user_id} already has active execution for campaign ${campaign.id}`);
      return;
    }

    // Create new execution
    const execution = {
      campaign_id: campaign.id,
      subscription_id: user_id,
      current_step_index: 0,
      status: 'active',
      trigger_data: JSON.stringify(eventData),
      step_history: JSON.stringify([]),
      next_execution_at: new Date(),
      started_at: new Date(),
      completed_at: null,
      failed_at: null,
      error_message: null,
      conversion_value: 0.00,
      converted_at: null
    };

    await campaignExecutions.insert(execution);
    
    // Update campaign stats
    await updateCampaignStats(campaign.id, 'entry_count');
    
    console.log(`Started campaign execution for user ${user_id} in campaign ${campaign.id}`);
  } catch (error) {
    console.error('Start campaign execution error:', error);
  }
}

async function updateCampaignStats(campaignId, field) {
  try {
    const { campaigns } = getDatastores();
    
    await campaigns.update(
      { id: campaignId },
      { 
        $inc: { [field]: 1 },
        $set: { updated_at: new Date() }
      }
    );
  } catch (error) {
    console.error('Update campaign stats error:', error);
  }
}

function generateCampaignAnalytics(campaign, executions) {
  const analytics = {
    overview: {
      totalExecutions: executions.length,
      activeExecutions: executions.filter(e => e.status === 'active').length,
      completedExecutions: executions.filter(e => e.status === 'completed').length,
      failedExecutions: executions.filter(e => e.status === 'failed').length,
      conversionRate: 0
    },
    timeline: [],
    stepPerformance: calculateStepPerformance(JSON.parse(campaign.steps), executions)
  };

  // Calculate conversion rate
  if (analytics.overview.totalExecutions > 0) {
    analytics.overview.conversionRate = 
      ((analytics.overview.completedExecutions / analytics.overview.totalExecutions) * 100).toFixed(2);
  }

  // Generate timeline data (group by day)
  const timelineMap = new Map();
  executions.forEach(execution => {
    const date = new Date(execution.started_at).toISOString().split('T')[0];
    if (!timelineMap.has(date)) {
      timelineMap.set(date, { date, started: 0, completed: 0, failed: 0 });
    }
    
    const dayData = timelineMap.get(date);
    dayData.started++;
    if (execution.status === 'completed') dayData.completed++;
    if (execution.status === 'failed') dayData.failed++;
  });

  analytics.timeline = Array.from(timelineMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  return analytics;
}

module.exports = router;
