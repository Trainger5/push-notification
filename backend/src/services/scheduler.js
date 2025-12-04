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

    // Clean up expired subscriptions daily at 2 AM
    cron.schedule('0 2 * * *', () => {
      this.cleanupExpiredSubscriptions();
    });

    console.log('✅ Notification scheduler started');
    console.log('✅ Subscription cleanup job scheduled (daily 2 AM)');
  }

  async scheduleNotification(notificationData) {
    const { scheduledNotifications } = getDatastores();

    const scheduledNotification = {
      customer_id: notificationData.customerId,
      name: notificationData.name || notificationData.title,
      description: notificationData.description || '',
      notification_data: JSON.stringify({
        title: notificationData.title,
        body: notificationData.body,
        url: notificationData.url,
        icon: notificationData.icon,
        badge: notificationData.badge,
        image: notificationData.image,
        tag: notificationData.tag,
        data: notificationData.data,
        actions: notificationData.actions
      }),
      scheduled_for: notificationData.scheduledFor,
      timezone: notificationData.timezone || 'UTC',
      recurring: false,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    };

    const doc = await scheduledNotifications.insert(scheduledNotification);
    console.log(`Notification scheduled for ${scheduledNotification.scheduled_for}:`, doc._id);

    return doc;
  }

  async processScheduledNotifications() {
    try {
      const { scheduledNotifications } = getDatastores();
      const now = new Date().toISOString();

      // Find notifications that should be sent now
      const dueNotifications = await scheduledNotifications.find({
        scheduled_for: { $lte: now },
        status: 'active'
      });

      for (const notification of dueNotifications) {
        try {
          await this.sendScheduledNotification(notification);

          // Update status to sent
          await scheduledNotifications.update(
            { id: notification.id },
            { $set: { status: 'sent', sent_at: new Date() } }
          );

          console.log(`Scheduled notification sent: ${notification._id}`);
        } catch (error) {
          console.error(`Failed to send scheduled notification ${notification._id}:`, error);

          // Update status to failed
          await scheduledNotifications.update(
            { id: notification.id },
            {
              $set: {
                status: 'failed',
                failed_at: new Date(),
                error_message: error.message
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
    const customer = await customers.findOne({ id: scheduledNotification.customer_id });
    if (!customer) {
      throw new Error('Customer not found');
    }

    const settings = await pushSettings.findOne({ customer_id: customer.id });
    if (!settings) {
      throw new Error('Push settings not found');
    }

    // Get all subscriptions for this customer
    const subs = await subscriptions.find({ customer_id: customer.id });
    if (subs.length === 0) {
      throw new Error('No subscribers found');
    }

    // Configure web-push
    webpush.setVapidDetails(
      settings.vapidSubject || process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
      settings.vapidPublicKey || process.env.VAPID_PUBLIC_KEY,
      settings.vapidPrivateKey || process.env.VAPID_PRIVATE_KEY
    );

    // Parse notification data
    const notificationData = typeof scheduledNotification.notification_data === 'string'
      ? JSON.parse(scheduledNotification.notification_data)
      : scheduledNotification.notification_data;

    // Prepare notification payload
    const payload = {
      title: notificationData.title,
      body: notificationData.body,
      url: notificationData.url,
      icon: notificationData.icon || settings.iconUrl,
      badge: notificationData.badge || settings.badgeUrl,
      image: notificationData.image,
      tag: notificationData.tag,
      data: notificationData.data
    };

    if (notificationData.actions) {
      payload.actions = notificationData.actions;
    }

    // Send to all subscribers
    let sent = 0;
    let failed = 0;
    const results = [];

    for (const sub of subs) {
      try {
        const subscriptionData = typeof sub.subscription === 'string' ? JSON.parse(sub.subscription) : sub.subscription;
        const pushSubscription = {
          endpoint: subscriptionData.endpoint,
          keys: {
            p256dh: subscriptionData.keys.p256dh,
            auth: subscriptionData.keys.auth
          }
        };

        await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
        sent++;
        results.push({ endpoint: subscriptionData.endpoint, status: 'sent' });
      } catch (error) {
        failed++;
        results.push({
          endpoint: subscriptionData ? subscriptionData.endpoint : 'unknown',
          status: 'failed',
          error: error.message
        });

        // Remove invalid subscriptions (410 = Gone, 404 = Not Found)
        if (error.statusCode === 410 || error.statusCode === 404) {
          await subscriptions.remove({ id: sub.id });
          console.log(`Removed invalid subscription: ${sub.id}`);
        }
      }
    }

    // Save notification record
    await notifications.insert({
      customer_id: customer.id,
      title: notificationData.title,
      body: notificationData.body,
      url: notificationData.url,
      target_type: 'all',
      target_count: subs.length,
      sent_count: sent,
      failed_count: failed,
      delivery_rate: subs.length > 0 ? ((sent / subs.length) * 100).toFixed(2) : 0,
      status: 'sent',
      sent_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    });

    return { sent, failed };
  }

  async cancelScheduledNotification(notificationId, customerId) {
    const { scheduledNotifications } = getDatastores();

    const notification = await scheduledNotifications.findOne({
      id: notificationId,
      customer_id: customerId,
      status: 'active'
    });

    if (!notification) {
      throw new Error('Scheduled notification not found or already processed');
    }

    await scheduledNotifications.update(
      { id: notificationId },
      {
        $set: {
          status: 'cancelled',
          updated_at: new Date()
        }
      }
    );

    console.log(`Scheduled notification cancelled: ${notificationId}`);
    return notification;
  }

  async getScheduledNotifications(customerId, status = null) {
    const { scheduledNotifications } = getDatastores();

    const query = { customer_id: customerId };
    if (status) {
      query.status = status;
    }

    return await scheduledNotifications.find(query, { sort: { scheduled_for: 1 } });
  }

  async updateScheduledNotification(notificationId, customerId, updates) {
    const { scheduledNotifications } = getDatastores();

    const notification = await scheduledNotifications.findOne({
      id: notificationId,
      customer_id: customerId,
      status: 'active'
    });

    if (!notification) {
      throw new Error('Scheduled notification not found or cannot be updated');
    }

    // Only allow updates to certain fields
    const allowedUpdates = ['name', 'description', 'notification_data', 'scheduled_for', 'timezone'];
    const updateData = {};

    for (const key of allowedUpdates) {
      if (updates.hasOwnProperty(key)) {
        updateData[key] = updates[key];
      }
    }

    updateData.updated_at = new Date();

    await scheduledNotifications.update(
      { id: notificationId },
      { $set: updateData }
    );

    return await scheduledNotifications.findOne({ id: notificationId });
  }

  async cleanupExpiredSubscriptions() {
    try {
      console.log('🧹 Starting subscription cleanup job...');
      const { subscriptions } = getDatastores();

      // Calculate cutoff dates
      const now = new Date();
      const staleDate = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000)); // 90 days ago
      const potentiallyExpiredDate = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000)); // 60 days ago

      // Find and mark potentially expired subscriptions (inactive for 60+ days)
      const potentiallyExpired = await subscriptions.find({
        last_active: { $lt: potentiallyExpiredDate.toISOString() },
        status: { $ne: 'potentially_expired' }
      });

      for (const sub of potentiallyExpired) {
        await subscriptions.update(
          { id: sub.id },
          { $set: { status: 'potentially_expired', updated_at: new Date() } }
        );
      }

      if (potentiallyExpired.length > 0) {
        console.log(`⚠️ Marked ${potentiallyExpired.length} subscriptions as potentially expired`);
      }

      // Remove very old subscriptions (90+ days inactive)
      const deleted = await subscriptions.remove({
        last_active: { $lt: staleDate.toISOString() }
      });

      if (deleted > 0) {
        console.log(`🗑️ Deleted ${deleted} stale subscriptions (90+ days inactive)`);
      }

      console.log('✅ Subscription cleanup completed');

      return {
        markedPotentiallyExpired: potentiallyExpired.length,
        deletedStale: deleted
      };

    } catch (error) {
      console.error('❌ Error during subscription cleanup:', error);
      return { error: error.message };
    }
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