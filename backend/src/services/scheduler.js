const cron = require('node-cron');
const webpush = require('web-push');
const { query } = require('../config/database');

class SchedulerService {
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
    try {
      // The notification is already stored in the database by the route
      console.log('Notification scheduled:', notificationData.id);
      return true;
    } catch (error) {
      console.error('Schedule notification error:', error);
      return false;
    }
  }

  async processScheduledNotifications() {
    try {
      // Get all pending scheduled notifications that are ready to send
      const [notifications] = await query(`
        SELECT sn.*, c.name as customer_name 
        FROM scheduled_notifications sn
        JOIN customers c ON sn.customer_id = c.id
        WHERE sn.status = 'pending' 
        AND sn.scheduled_at <= NOW()
        ORDER BY sn.scheduled_at ASC
        LIMIT 10
      `);

      for (const notification of notifications) {
        await this.executeScheduledNotification(notification);
      }

    } catch (error) {
      console.error('Process scheduled notifications error:', error);
    }
  }

  async executeScheduledNotification(scheduledNotification) {
    try {
      console.log('Executing scheduled notification:', scheduledNotification.id);

      // Mark as processing
      await query(
        'UPDATE scheduled_notifications SET status = "processing", updated_at = ? WHERE id = ?',
        [new Date(), scheduledNotification.id]
      );

      // Get customer push settings
      const [settings] = await query(
        'SELECT * FROM push_settings WHERE customer_id = ?',
        [scheduledNotification.customer_id]
      );

      if (!settings || !settings[0]) {
        console.error('No push settings found for customer:', scheduledNotification.customer_id);
        await this.markNotificationFailed(scheduledNotification.id, 'No push settings');
        return;
      }

      // Get active subscriptions
      let subscriptions = [];
      
      if (scheduledNotification.segment_id) {
        // Get subscriptions for specific segment (would need segment logic here)
        const [segmentSubs] = await query(
          'SELECT ps.* FROM push_subscriptions ps WHERE ps.customer_id = ? AND ps.status = "active"',
          [scheduledNotification.customer_id]
        );
        subscriptions = segmentSubs;
      } else {
        // Get all active subscriptions for customer
        const [allSubs] = await query(
          'SELECT * FROM push_subscriptions WHERE customer_id = ? AND status = "active"',
          [scheduledNotification.customer_id]
        );
        subscriptions = allSubs;
      }

      if (subscriptions.length === 0) {
        console.log('No active subscriptions found for scheduled notification:', scheduledNotification.id);
        await this.markNotificationCompleted(scheduledNotification.id, 0, 0);
        return;
      }

      // Set up web push
      webpush.setVapidDetails(
        settings[0].vapid_subject,
        settings[0].vapid_public_key,
        settings[0].vapid_private_key
      );

      const payload = {
        title: scheduledNotification.title,
        body: scheduledNotification.body,
        url: scheduledNotification.url || '/',
        icon: scheduledNotification.icon || '/icon.png',
        tag: `scheduled-${scheduledNotification.id}`
      };

      let sent = 0;
      let failed = 0;

      // Send notifications
      await Promise.all(subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh_key,
              auth: subscription.auth_key
            }
          }, JSON.stringify(payload));
          sent++;
        } catch (error) {
          console.error('Failed to send scheduled notification:', error);
          failed++;
        }
      }));

      // Record the sent notification in notifications table
      const { v4: uuidv4 } = require('uuid');
      const notificationId = uuidv4();
      await query(`
        INSERT INTO notifications 
        (id, customer_id, title, body, url, icon, status, sent_count, failed_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'sent', ?, ?, ?, ?)
      `, [
        notificationId, scheduledNotification.customer_id, payload.title, payload.body,
        payload.url, payload.icon, sent, failed, new Date(), new Date()
      ]);

      // Mark scheduled notification as completed
      await this.markNotificationCompleted(scheduledNotification.id, sent, failed);

      console.log(`Scheduled notification ${scheduledNotification.id} sent to ${sent} subscribers, ${failed} failed`);

    } catch (error) {
      console.error('Execute scheduled notification error:', error);
      await this.markNotificationFailed(scheduledNotification.id, error.message);
    }
  }

  async markNotificationCompleted(notificationId, sent, failed) {
    await query(`
      UPDATE scheduled_notifications 
      SET status = 'sent', sent_count = ?, failed_count = ?, completed_at = ?, updated_at = ?
      WHERE id = ?
    `, [sent, failed, new Date(), new Date(), notificationId]);
  }

  async markNotificationFailed(notificationId, errorMessage) {
    await query(`
      UPDATE scheduled_notifications 
      SET status = 'failed', error_message = ?, updated_at = ?
      WHERE id = ?
    `, [errorMessage, new Date(), notificationId]);
  }

  async cancelScheduledNotification(notificationId, customerId) {
    try {
      await query(
        'UPDATE scheduled_notifications SET status = "cancelled", updated_at = ? WHERE id = ? AND customer_id = ?',
        [new Date(), notificationId, customerId]
      );
      return true;
    } catch (error) {
      console.error('Cancel scheduled notification error:', error);
      return false;
    }
  }

  async getScheduledNotifications(customerId, status = null) {
    try {
      let sqlQuery = 'SELECT * FROM scheduled_notifications WHERE customer_id = ?';
      let params = [customerId];
      
      if (status) {
        sqlQuery += ' AND status = ?';
        params.push(status);
      }
      
      sqlQuery += ' ORDER BY scheduled_at DESC';
      
      const [notifications] = await query(sqlQuery, params);
      return notifications;
    } catch (error) {
      console.error('Get scheduled notifications error:', error);
      return [];
    }
  }

  async updateScheduledNotification(notificationId, customerId, updates) {
    try {
      const updateFields = [];
      const params = [];
      
      if (updates.title) { updateFields.push('title = ?'); params.push(updates.title); }
      if (updates.body) { updateFields.push('body = ?'); params.push(updates.body); }
      if (updates.scheduled_at) { updateFields.push('scheduled_at = ?'); params.push(updates.scheduled_at); }
      
      updateFields.push('updated_at = ?');
      params.push(new Date());
      params.push(notificationId, customerId);

      await query(`
        UPDATE scheduled_notifications 
        SET ${updateFields.join(', ')} 
        WHERE id = ? AND customer_id = ?
      `, params);
      
      return true;
    } catch (error) {
      console.error('Update scheduled notification error:', error);
      return false;
    }
  }
}

// Create a singleton instance
let schedulerInstance = null;

function getScheduler() {
  if (!schedulerInstance) {
    schedulerInstance = new SchedulerService();
  }
  return schedulerInstance;
}

module.exports = { SchedulerService, getScheduler };