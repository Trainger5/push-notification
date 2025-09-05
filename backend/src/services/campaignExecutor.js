const webpush = require('web-push');
const { getDatastores } = require('../storage/datastores');

class CampaignExecutor {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  start() {
    if (this.isRunning) return;
    
    console.log('Campaign executor started');
    this.isRunning = true;
    
    // Check for pending executions every minute
    this.intervalId = setInterval(() => {
      this.processPendingExecutions();
    }, 60000); // 1 minute
    
    // Initial run
    this.processPendingExecutions();
  }

  stop() {
    if (!this.isRunning) return;
    
    console.log('Campaign executor stopped');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async processPendingExecutions() {
    try {
      const { campaignExecutions, campaigns } = getDatastores();
      
      // Find executions that are ready to process
      const now = new Date();
      const pendingExecutions = await campaignExecutions.find({
        status: { $in: ['active', 'waiting'] },
        next_execution_at: { $lte: now }
      });

      console.log(`Processing ${pendingExecutions.length} pending campaign executions`);

      for (const execution of pendingExecutions) {
        await this.processExecution(execution);
      }
    } catch (error) {
      console.error('Error processing campaign executions:', error);
    }
  }

  async processExecution(execution) {
    try {
      const { campaigns } = getDatastores();
      
      // Get the campaign
      const campaign = await campaigns.findOne({ id: execution.campaign_id });
      if (!campaign || campaign.status !== 'active') {
        await this.failExecution(execution, 'Campaign not active or not found');
        return;
      }

      // Get current step
      const steps = JSON.parse(campaign.steps);
      const currentStep = steps[execution.current_step_index];
      if (!currentStep) {
        await this.completeExecution(execution);
        return;
      }

      console.log(`Processing step ${execution.current_step_index + 1} of campaign ${campaign.name} for user ${execution.subscription_id}`);

      // Process step based on type
      let stepResult;
      switch (currentStep.type) {
        case 'notification':
          stepResult = await this.processNotificationStep(execution, currentStep, campaign);
          break;
        case 'wait':
          stepResult = await this.processWaitStep(execution, currentStep);
          break;
        case 'condition':
          stepResult = await this.processConditionStep(execution, currentStep, campaign);
          break;
        case 'segment_update':
          stepResult = await this.processSegmentUpdateStep(execution, currentStep, campaign);
          break;
        case 'webhook':
          stepResult = await this.processWebhookStep(execution, currentStep, campaign);
          break;
        default:
          stepResult = { success: false, error: `Unknown step type: ${currentStep.type}` };
      }

      // Update execution based on step result
      if (stepResult.success) {
        await this.advanceExecution(execution, currentStep, stepResult.nextExecutionAt);
      } else {
        await this.failExecution(execution, stepResult.error || 'Step processing failed');
      }

    } catch (error) {
      console.error(`Error processing execution ${execution.id}:`, error);
      await this.failExecution(execution, error.message);
    }
  }

  async processNotificationStep(execution, step, campaign) {
    try {
      const { subscriptions, pushSettings } = getDatastores();
      
      // Get user subscription
      const subscription = await subscriptions.findOne({ id: execution.subscription_id });
      if (!subscription) {
        return { success: false, error: 'User subscription not found' };
      }

      // Get VAPID settings
      const settings = await pushSettings.findOne({ customer_id: campaign.customer_id });
      const vapidPublicKey = settings?.vapid_public_key || process.env.VAPID_PUBLIC_KEY;
      const vapidPrivateKey = settings?.vapid_private_key || process.env.VAPID_PRIVATE_KEY;
      const vapidSubject = settings?.vapid_subject || process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

      if (!vapidPublicKey || !vapidPrivateKey) {
        return { success: false, error: 'Missing VAPID keys' };
      }

      webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

      // Prepare notification payload
      const payload = JSON.stringify({
        title: this.processVariables(step.title, execution),
        body: this.processVariables(step.body, execution),
        url: step.url ? this.processVariables(step.url, execution) : undefined,
        image: step.image,
        icon: step.icon,
        badge: step.badge,
        tag: step.tag,
        data: {
          campaignId: execution.campaign_id,
          stepId: step.id,
          executionId: execution.id
        },
        track: {
          openUrl: `/api/metrics/open?cid=${encodeURIComponent(campaign.customer_id)}&campaignId=${encodeURIComponent(execution.campaign_id)}`,
          clickUrl: `/api/metrics/click?cid=${encodeURIComponent(campaign.customer_id)}&campaignId=${encodeURIComponent(execution.campaign_id)}`
        }
      });

      // Send notification  
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh_key,
          auth: subscription.auth_key
        }
      };
      await webpush.sendNotification(pushSubscription, payload);
      
      console.log(`Notification sent for step ${step.name || step.type} to user ${execution.subscription_id}`);
      
      return { success: true };
    } catch (error) {
      console.error('Notification step error:', error);
      return { success: false, error: error.message };
    }
  }

  async processWaitStep(execution, step) {
    try {
      // Calculate next execution time based on wait duration
      const now = new Date();
      let nextExecutionAt;
      
      switch (step.unit) {
        case 'minutes':
          nextExecutionAt = new Date(now.getTime() + step.duration * 60 * 1000);
          break;
        case 'hours':
          nextExecutionAt = new Date(now.getTime() + step.duration * 60 * 60 * 1000);
          break;
        case 'days':
          nextExecutionAt = new Date(now.getTime() + step.duration * 24 * 60 * 60 * 1000);
          break;
        case 'weeks':
          nextExecutionAt = new Date(now.getTime() + step.duration * 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          nextExecutionAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to 1 day
      }

      console.log(`Wait step: scheduling next execution for ${nextExecutionAt.toISOString()}`);
      
      return { 
        success: true, 
        nextExecutionAt: nextExecutionAt.toISOString()
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async processConditionStep(execution, step, campaign) {
    try {
      // Simple condition evaluation
      // In a real implementation, you'd have more sophisticated condition logic
      const conditionMet = await this.evaluateCondition(step.condition, execution, campaign);
      
      if (conditionMet) {
        console.log(`Condition step passed for subscription ${execution.subscription_id}`);
        return { success: true };
      } else {
        // Exit campaign if condition not met
        console.log(`Condition step failed for subscription ${execution.subscription_id}, exiting campaign`);
        return { success: false, error: 'Condition not met, exiting campaign' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async processSegmentUpdateStep(execution, step, campaign) {
    try {
      const { subscriptions, userSegments } = getDatastores();
      
      // Update user segment membership based on step configuration
      // This is a simplified implementation
      console.log(`Segment update step for subscription ${execution.subscription_id}`);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async processWebhookStep(execution, step, campaign) {
    try {
      // Trigger webhook with execution data
      if (!step.webhookUrl) {
        return { success: false, error: 'Webhook URL not specified' };
      }

      const webhookPayload = {
        campaignId: execution.campaign_id,
        executionId: execution.id,
        subscriptionId: execution.subscription_id,
        stepId: step.id,
        stepName: step.name,
        timestamp: new Date().toISOString(),
        data: this.parseTriggerData(execution)
      };

      // In a real implementation, you'd make an HTTP request to the webhook URL
      console.log(`Webhook step triggered for ${step.webhookUrl} with payload:`, webhookPayload);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async advanceExecution(execution, completedStep, nextExecutionAt) {
    try {
      const { campaignExecutions, campaigns } = getDatastores();
      
      // Add completed step to history
      const stepHistory = this.getStepHistory(execution);
      stepHistory.push({
        step_id: completedStep.id,
        step_type: completedStep.type,
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration: null
      });

      // Move to next step
      const nextStepIndex = (execution.current_step_index || 0) + 1;
      const campaign = await campaigns.findOne({ id: execution.campaign_id });
      
      const steps = Array.isArray(campaign.steps) ? campaign.steps : JSON.parse(campaign.steps || '[]');
      if (nextStepIndex >= steps.length) {
        // Campaign completed
        await campaignExecutions.update(
          { id: execution.id },
          { $set: {
              status: 'completed',
              step_history: JSON.stringify(stepHistory),
              updated_at: new Date(),
              completed_at: new Date()
            } }
        );
        console.log(`Campaign execution completed for subscription ${execution.subscription_id}`);
      } else {
        // Move to next step
        const updateData = {
          current_step_index: nextStepIndex,
          step_history: JSON.stringify(stepHistory),
          updated_at: new Date(),
          next_execution_at: nextExecutionAt || new Date().toISOString()
        };

        // If this was a wait step, set status to waiting
        if (nextExecutionAt && new Date(nextExecutionAt) > new Date()) {
          updateData.status = 'waiting';
        }

        await campaignExecutions.update(
          { id: execution.id },
          { $set: updateData }
        );
      }
    } catch (error) {
      console.error('Error advancing execution:', error);
      await this.failExecution(execution, 'Failed to advance execution');
    }
  }

  async completeExecution(execution) {
    try {
      const { campaignExecutions } = getDatastores();
      
      await campaignExecutions.update(
        { id: execution.id },
        { $set: {
            status: 'completed',
            updated_at: new Date(),
            completed_at: new Date()
          } }
      );
      
      console.log(`Campaign execution completed for subscription ${execution.subscription_id}`);
    } catch (error) {
      console.error('Error completing execution:', error);
    }
  }

  async failExecution(execution, errorMessage) {
    try {
      const { campaignExecutions } = getDatastores();
      
      await campaignExecutions.update(
        { id: execution.id },
        { $set: {
            status: 'failed',
            error_message: errorMessage,
            updated_at: new Date(),
            failed_at: new Date()
          } }
      );
      
      console.log(`Campaign execution failed for subscription ${execution.subscription_id}: ${errorMessage}`);
    } catch (error) {
      console.error('Error failing execution:', error);
    }
  }

  processVariables(text, execution) {
    if (!text) return text;
    
    // Simple variable replacement
    // In a real implementation, you'd have more sophisticated variable processing
    let processed = text;
    
    // Replace execution-specific variables
    processed = processed.replace(/{{subscriptionId}}/g, String(execution.subscription_id || ''));
    processed = processed.replace(/{{campaignId}}/g, String(execution.campaign_id || ''));
    
    // Replace trigger data variables
    const trigger = this.parseTriggerData(execution);
    if (trigger) {
      Object.keys(trigger).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processed = processed.replace(regex, String(trigger[key]));
      });
    }
    
    return processed;
  }

  getStepHistory(execution) {
    try {
      if (Array.isArray(execution.step_history)) return execution.step_history;
      if (execution.step_history) return JSON.parse(execution.step_history);
    } catch (_) {}
    return [];
  }

  parseTriggerData(execution) {
    try {
      if (execution.trigger_data && typeof execution.trigger_data === 'string') {
        return JSON.parse(execution.trigger_data);
      }
      if (execution.trigger_data && typeof execution.trigger_data === 'object') {
        return execution.trigger_data;
      }
    } catch (_) {}
    return null;
  }

  async evaluateCondition(condition, execution, campaign) {
    try {
      // Simple condition evaluation
      // In a real implementation, you'd have more sophisticated condition logic
      
      switch (condition.field) {
        case 'user_active':
          // Check if user is active (simplified)
          return true;
        case 'engagement_score':
          // Check user engagement score
          return Math.random() > 0.5; // Placeholder
        default:
          return true;
      }
    } catch (error) {
      console.error('Condition evaluation error:', error);
      return false;
    }
  }
}

// Singleton instance
let campaignExecutorInstance = null;

function getCampaignExecutor() {
  if (!campaignExecutorInstance) {
    campaignExecutorInstance = new CampaignExecutor();
  }
  return campaignExecutorInstance;
}

module.exports = { getCampaignExecutor };
