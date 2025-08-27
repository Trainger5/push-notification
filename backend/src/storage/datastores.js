const path = require('path');
const Datastore = require('nedb-promises');
const bcrypt = require('bcryptjs');

let stores = null;

function getDatastores() {
  if (stores) return stores;
  const base = path.join(__dirname, '..', '..', 'data');
  stores = {
    users: Datastore.create({ filename: path.join(base, 'users.db'), autoload: true }),
    customers: Datastore.create({ filename: path.join(base, 'customers.db'), autoload: true }),
    apiKeys: Datastore.create({ filename: path.join(base, 'apiKeys.db'), autoload: true }),
    subscriptions: Datastore.create({ filename: path.join(base, 'subscriptions.db'), autoload: true }),
    pushSettings: Datastore.create({ filename: path.join(base, 'pushSettings.db'), autoload: true }),
    notifications: Datastore.create({ filename: path.join(base, 'notifications.db'), autoload: true }),
    scheduledNotifications: Datastore.create({ filename: path.join(base, 'scheduledNotifications.db'), autoload: true }),
    notificationTemplates: Datastore.create({ filename: path.join(base, 'notificationTemplates.db'), autoload: true }),
    userSegments: Datastore.create({ filename: path.join(base, 'userSegments.db'), autoload: true }),
    metrics: Datastore.create({ filename: path.join(base, 'metrics.db'), autoload: true }),
    webhooks: Datastore.create({ filename: path.join(base, 'webhooks.db'), autoload: true }),
    webhookDeliveries: Datastore.create({ filename: path.join(base, 'webhookDeliveries.db'), autoload: true })
  };
  return stores;
}

async function seedAdminIfMissing() {
  const { users } = getDatastores();
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe!234';
  const existing = await users.findOne({ email, role: 'admin' });
  if (existing) return existing;
  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await users.insert({ email, passwordHash, role: 'admin', createdAt: new Date().toISOString() });
  return admin;
}

module.exports = { getDatastores, seedAdminIfMissing };


