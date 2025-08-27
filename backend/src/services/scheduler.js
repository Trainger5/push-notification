const cron = require('node-cron');
const webpush = require('web-push');
const { getDatastores } = require('../storage/datastores');

class NotificationScheduler {
  constructor() {
    this.scheduledJobs = new Map();
    this.startScheduler();
  }

  startScheduler() {
    // Check for scheduled notifications every minute
    cron.schedule('* * * * *', () => {
      this.processScheduledNotifications();
    });
    
    console.log('Notification scheduler started');
  }

  async scheduleNotification(notificationData) {
    const { scheduledNotifications } = getDatastores();
    
    const scheduledNotification = {
      customerId: notificationData.customerId,
      title: notificationData.title,
      body: notificationData.body,
      url: notificationData.url,
      icon: notificationData.icon,
      badge: notificationData.badge,
      image: notificationData.image,
      tag: notificationData.tag,
      data: notificationData.data,
      actions: notificationData.actions,
      scheduledFor: notificationData.scheduledFor, // ISO string
      timezone: notificationData.timezone || 'UTC',
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      createdBy: notificationData.createdBy
    };
    
    const doc = await scheduledNotifications.insert(scheduledNotification);
    console.log(`Notification scheduled for ${scheduledNotification.scheduledFor}:`, doc._id);
    
    return doc;
  }

  async processScheduledNotifications() {
    try {
      const { scheduledNotifications } = getDatastores();
      const now = new Date().toISOString();
      
      // Find notifications that should be sent now
      const dueNotifications = await scheduledNotifications.find({
        scheduledFor: { $lte: now },
        status: 'scheduled'
      });

      for (const notification of dueNotifications) {
        try {
          await this.sendScheduledNotification(notification);
          
          // Update status to sent
          await scheduledNotifications.update(
            { _id: notification._id },
            { $set: { status: 'sent', sentAt: new Date().toISOString() } }
          );
          
          console.log(`Scheduled notification sent: ${notification._id}`);
        } catch (error) {
          console.error(`Failed to send scheduled notification ${notification._id}:`, error);
          
          // Update status to failed
          await scheduledNotifications.update(
            { _id: notification._id },
            { 
              $set: { 
                status: 'failed', 
                failedAt: new Date().toISOString(),
                error: error.message 
              } 
            }
          );
        }
      }
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
    }
  }

  async sendScheduledNotification(scheduledNotification) {
    const { customers, subscriptions, pushSettings, notifications } = getDatastores();
    
    // Get customer and settings
    const customer = await customers.findOne({ _id: scheduledNotification.customerId });
    if (!customer) {
      throw new Error('Customer not found');
    }

    const settings = await pushSettings.findOne({ customerId: customer._id });
    if (!settings) {
      throw new Error('Push settings not found');
    }

    // Get all subscriptions for this customer
    const subs = await subscriptions.find({ customerId: customer._id });
    if (subs.length === 0) {
      throw new Error('No subscribers found');
    }

    // Configure web-push
    webpush.setVapidDetails(
      settings.vapidSubject || process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
      settings.vapidPublicKey || process.env.VAPID_PUBLIC_KEY,
      settings.vapidPrivateKey || process.env.VAPID_PRIVATE_KEY
    );

    // Prepare notification payload
    const payload = {
      title: scheduledNotification.title,
      body: scheduledNotification.body,
      url: scheduledNotification.url,
      icon: scheduledNotification.icon || settings.iconUrl,
      badge: scheduledNotification.badge || settings.badgeUrl,
      image: scheduledNotification.image,
      tag: scheduledNotification.tag,
      data: scheduledNotification.data
    };

    if (scheduledNotification.actions) {
      payload.actions = scheduledNotification.actions;
    }

    // Send to all subscribers
    let sent = 0;
    let failed = 0;
    const results = [];

    for (const sub of subs) {
      try {
        const pushSubscription = {
          endpoint: sub.subscription.endpoint,
          keys: {
            p256dh: sub.subscription.keys.p256dh,
            auth: sub.subscription.keys.auth
          }
        };

        await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
        sent++;
        results.push({ endpoint: sub.subscription.endpoint, status: 'sent' });
      } catch (error) {
        failed++;
        results.push({ 
          endpoint: sub.subscription.endpoint, 
          status: 'failed', 
          error: error.message 
        });
        
        // Remove invalid subscriptions (410 = Gone, 404 = Not Found)
        if (error.statusCode === 410 || error.statusCode === 404) {
          await subscriptions.remove({ _id: sub._id });
          console.log(`Removed invalid subscription: ${sub._id}`);
        }
      }
    }

    // Save notification record
    await notifications.insert({
      customerId: customer._id,
      title: scheduledNotification.title,
      body: scheduledNotification.body,
      url: scheduledNotification.url,
      success: sent,
      failed: failed,
      scheduledNotificationId: scheduledNotification._id,
      isScheduled: true,
      createdAt: new Date().toISOString(),
      results: results
    });

    return { sent, failed };
  }

  async cancelScheduledNotification(notificationId, customerId) {
    const { scheduledNotifications } = getDatastores();
    
    const notification = await scheduledNotifications.findOne({ 
      _id: notificationId, 
      customerId: customerId,
      status: 'scheduled'
    });
    
    if (!notification) {
      throw new Error('Scheduled notification not found or already processed');
    }
    
    await scheduledNotifications.update(
      { _id: notificationId },
      { 
        $set: { 
          status: 'cancelled', 
          cancelledAt: new Date().toISOString() 
        } 
      }
    );
    
    console.log(`Scheduled notification cancelled: ${notificationId}`);
    return notification;
  }

  async getScheduledNotifications(customerId, status = null) {
    const { scheduledNotifications } = getDatastores();
    
    const query = { customerId };
    if (status) {
      query.status = status;
    }
    
    return await scheduledNotifications.find(query).sort({ scheduledFor: 1 });
  }

  async updateScheduledNotification(notificationId, customerId, updates) {
    const { scheduledNotifications } = getDatastores();
    
    const notification = await scheduledNotifications.findOne({ 
      _id: notificationId, 
      customerId: customerId,
      status: 'scheduled'
    });
    
    if (!notification) {
      throw new Error('Scheduled notification not found or cannot be updated');
    }
    
    // Only allow updates to certain fields
    const allowedUpdates = ['title', 'body', 'url', 'icon', 'badge', 'image', 'tag', 'data', 'actions', 'scheduledFor', 'timezone'];
    const updateData = {};
    
    for (const key of allowedUpdates) {
      if (updates.hasOwnProperty(key)) {
        updateData[key] = updates[key];
      }
    }
    
    updateData.updatedAt = new Date().toISOString();
    
    await scheduledNotifications.update(
      { _id: notificationId },
      { $set: updateData }
    );
    
    return await scheduledNotifications.findOne({ _id: notificationId });
  }
}

// Singleton instance
let schedulerInstance = null;

function getScheduler() {
  if (!schedulerInstance) {
    schedulerInstance = new NotificationScheduler();
  }
  return schedulerInstance;
}

module.exports = { getScheduler };