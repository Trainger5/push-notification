const { v4: uuidv4 } = require('uuid')
const bcrypt = require('bcryptjs')

// Minimal in-memory datastore for local testing without MySQL
// Mirrors the interface used by routes (findOne, find, count, insert, update, remove)

class MemoryStore {
  constructor(name, pk = 'id') {
    this.name = name
    this.pk = pk
    this.items = []
  }

  async findOne(conditions = {}) {
    const list = await this.find(conditions, { limit: 1 })
    return list[0] || null
  }

  async find(conditions = {}, options = {}) {
    let list = this.items.filter((item) => matches(item, conditions))
    if (options.sort) {
      const [[key, dir]] = Object.entries(options.sort)
      list = list.sort((a, b) => {
        if (a[key] < b[key]) return dir === -1 ? 1 : -1
        if (a[key] > b[key]) return dir === -1 ? -1 : 1
        return 0
      })
    }
    if (options.skip) list = list.slice(options.skip)
    if (options.limit) list = list.slice(0, options.limit)
    return list
  }

  async count(conditions = {}) {
    return (await this.find(conditions)).length
  }

  async insert(doc) {
    const toInsert = { ...(doc || {}) }
    if (!toInsert[this.pk]) toInsert[this.pk] = uuidv4()
    this.items.push(toInsert)
    return toInsert
  }

  async update(conditions, updateData) {
    let updated = 0
    for (let i = 0; i < this.items.length; i++) {
      if (matches(this.items[i], conditions)) {
        const target = this.items[i]
        const patch = updateData.$set ? updateData.$set : updateData
        this.items[i] = { ...target, ...patch }
        updated++
      }
    }
    return updated
  }

  async remove(conditions /*, opts */) {
    const before = this.items.length
    this.items = this.items.filter((item) => !matches(item, conditions))
    return before - this.items.length
  }
}

function matches(obj, cond) {
  const keys = Object.keys(cond || {})
  if (keys.length === 0) return true
  return keys.every((k) => {
    const val = cond[k]
    if (val === null) return obj[k] == null
    if (typeof val === 'object' && val !== null) {
      // very small subset of operators
      if ('$in' in val) return Array.isArray(val.$in) ? val.$in.includes(obj[k]) : false
      if ('$gte' in val) return obj[k] >= val.$gte
      if ('$gt' in val) return obj[k] > val.$gt
      if ('$lte' in val) return obj[k] <= val.$lte
      if ('$lt' in val) return obj[k] < val.$lt
      return obj[k] === val
    }
    return obj[k] === val
  })
}

let stores = null

function getMemoryDatastores() {
  if (stores) return stores

  stores = {
    users: new MemoryStore('users'),
    customers: new MemoryStore('customers'),
    apiKeys: new MemoryStore('api_keys'),
    subscriptions: new MemoryStore('push_subscriptions'),
    pushSettings: new MemoryStore('push_settings'),
    notifications: new MemoryStore('notifications'),
    scheduledNotifications: new MemoryStore('scheduled_notifications'),
    notificationTemplates: new MemoryStore('notification_templates'),
    userSegments: new MemoryStore('user_segments'),
    metrics: new MemoryStore('metrics'),
    webhooks: new MemoryStore('webhooks'),
    webhookDeliveries: new MemoryStore('webhook_deliveries'),
    abTests: new MemoryStore('ab_tests'),
    abTestVariants: new MemoryStore('ab_test_variants'),
    abTestParticipants: new MemoryStore('ab_test_participants'),
    campaigns: new MemoryStore('campaigns'),
    campaignExecutions: new MemoryStore('campaign_executions'),
    notificationDeliveries: new MemoryStore('notification_deliveries'),
    analyticsSummaries: new MemoryStore('analytics_summaries'),
    segmentMemberships: new MemoryStore('segment_memberships')
  }

  return stores
}

async function seedAdminIfMissing() {
  const ds = getMemoryDatastores()
  const { users, customers, pushSettings } = ds

  // Admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  let admin = await users.findOne({ email: adminEmail, role: 'admin' })
  if (!admin) {
    const hash = await bcrypt.hash(adminPassword, 12)
    admin = await users.insert({ email: adminEmail, password_hash: hash, role: 'admin', email_verified: true, created_at: new Date() })
  }

  // Demo customer user
  const demoEmail = 'demo@customer.com'
  let demoUser = await users.findOne({ email: demoEmail, role: 'customer' })
  if (!demoUser) {
    const hash = await bcrypt.hash('password123', 12)
    demoUser = await users.insert({ email: demoEmail, password_hash: hash, role: 'customer', email_verified: true, created_at: new Date() })
    const demoCustomer = await customers.insert({
      user_id: demoUser.id,
      name: 'Demo Company',
      email: demoEmail,
      api_key: 'demo_' + Math.random().toString(36).slice(2, 10),
      status: 'active',
      plan: 'pro',
      subscriber_limit: 10000,
      created_at: new Date()
    })
    // No VAPID here; real keys will be generated during /api/auth/register or /api/config
    await pushSettings.insert({ customer_id: demoCustomer.id, created_at: new Date() })
  }

  return admin
}

module.exports = { getMemoryDatastores, seedAdminIfMissing, MemoryStore }

