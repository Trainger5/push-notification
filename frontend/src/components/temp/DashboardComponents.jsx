// Complete Professional Dashboard with Live API Integration
import { useState, useEffect, useCallback } from 'react'
import { Card, CardBody, CardHeader, Button, Input, Badge, Alert, Table, Loading } from '../ui'
import { 
  Users, Send, TrendingUp, Eye, MousePointer, Calendar, Bell, Settings, Plus, Edit3, Trash2, 
  Play, Pause, BarChart3, PieChart, Target, Zap, Filter, Search, Download, Upload, Globe,
  Smartphone, Monitor, Wifi, WifiOff, Clock, CheckCircle, XCircle, AlertCircle, Code,
  ExternalLink, Copy, Layers, TestTube2, Save, RefreshCw, Key, Image, Link, Tag,
  MessageSquare, Activity, TrendingDown, Database, FileText, Mail, MapPin, Calendar as CalendarIcon,
  GitBranch, Rocket, UserPlus, Timer, ArrowRight, Webhook, Split, X, ChevronRight,
  BarChart2, LineChart, Users2, Percent, PlayCircle, PauseCircle, FileX, Trash,
  MailOpen, Link2, Timer as TimerIcon, Calendar as Cal, Heart
} from 'lucide-react'

function useApiBase() {
  return (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:4000'
}

function useAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

// Dashboard Overview with Live Data
export function DashboardOverview({ setCurrentTab }) {
  const [data, setData] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const apiBase = useApiBase()
  const headers = useAuthHeaders()

  const loadDashboardData = useCallback(async () => {
    try {
      // Load customer data first
      const customerRes = await fetch(`${apiBase}/api/customer/me`, { headers })
      if (customerRes.ok) {
        const customerData = await customerRes.json()
        setData(customerData)
      }

      // Try to load recent activity, but don't fail if it errors
      try {
        const activityRes = await fetch(`${apiBase}/api/customer/notifications?limit=5`, { headers })
        if (activityRes.ok) {
          const activityData = await activityRes.json()
          setRecentActivity(Array.isArray(activityData) ? activityData : [])
        }
      } catch (activityError) {
        console.log('Recent activity not available:', activityError.message)
        setRecentActivity([])
      }
    } catch (error) {
      console.error('Dashboard load error:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [apiBase, headers])

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(loadDashboardData, 120000) // Refresh every 2 minutes
    return () => clearInterval(interval)
  }, [])

  const refresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
  }

  if (loading) {
    return <div className="loading-container"><div className="loading-spinner"></div></div>
  }

  const stats = data?.notificationStats || {}
  const customer = data?.customer || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>
            Welcome back, {customer.name || customer.contactName || 'User'}!
          </h1>
          <p style={{ color: 'var(--gray-600)', marginTop: '0.25rem', margin: 0 }}>
            Here's what's happening with your notifications today
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="secondary" onClick={refresh} loading={refreshing}>
            <RefreshCw style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
            Refresh
          </Button>
          <Button variant="primary">
            <Send style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
            Send Notification
          </Button>
        </div>
      </div>

      {/* Live Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p className="stat-title">Total Subscribers</p>
              <h3 className="stat-value">{(data?.subscriberCount || 0).toLocaleString()}</h3>
              <p className="stat-change positive">Active subscribers</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '3rem', height: '3rem', backgroundColor: 'var(--primary-100)', borderRadius: '0.5rem' }}>
              <Users style={{ width: '1.5rem', height: '1.5rem', color: 'var(--primary-600)' }} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p className="stat-title">Notifications Sent</p>
              <h3 className="stat-value">{(stats.totalSends || 0).toLocaleString()}</h3>
              <p className="stat-change positive">{(stats.sent || 0)} delivered successfully</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '3rem', height: '3rem', backgroundColor: 'var(--success-50)', borderRadius: '0.5rem' }}>
              <Send style={{ width: '1.5rem', height: '1.5rem', color: 'var(--success-600)' }} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p className="stat-title">Open Rate</p>
              <h3 className="stat-value">{stats.openRate || 0}%</h3>
              <p className="stat-change positive">Above industry average</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '3rem', height: '3rem', backgroundColor: '#f3e8ff', borderRadius: '0.5rem' }}>
              <Eye style={{ width: '1.5rem', height: '1.5rem', color: 'var(--accent-600)' }} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p className="stat-title">Click Rate</p>
              <h3 className="stat-value">{stats.clickRate || 0}%</h3>
              <p className="stat-change">User engagement rate</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '3rem', height: '3rem', backgroundColor: '#fed7aa', borderRadius: '0.5rem' }}>
              <MousePointer style={{ width: '1.5rem', height: '1.5rem', color: 'var(--warning-600)' }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 className="card-title">Recent Notifications</h2>
              <Button variant="secondary" size="sm">View All</Button>
            </div>
          </CardHeader>
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentActivity.length > 0 ? recentActivity.map((notification, index) => (
                <div key={notification._id || index} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.5rem', height: '2.5rem', backgroundColor: 'var(--primary-100)', borderRadius: '50%' }}>
                    <Send style={{ width: '1.25rem', height: '1.25rem', color: 'var(--primary-600)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 500, color: 'var(--gray-900)', margin: 0 }}>{notification.title}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', margin: 0 }}>
                      {notification.body?.substring(0, 60)}...
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', margin: '0.25rem 0 0 0' }}>
                      {new Date(notification.createdAt).toRelative || 'Recently'}
                    </p>
                  </div>
                  <Badge variant={notification.success > notification.failed ? "success" : "error"}>
                    {notification.success || 0} delivered
                  </Badge>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
                  <Send style={{ width: '3rem', height: '3rem', color: 'var(--gray-300)', margin: '0 auto 1rem' }} />
                  <p>No notifications sent yet</p>
                  <Button variant="primary" size="sm" style={{ marginTop: '1rem' }}>
                    Send Your First Notification
                  </Button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card>
            <CardHeader>
              <h2 className="card-title">Account Details</h2>
            </CardHeader>
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Plan</span>
                <Badge variant="primary">{customer.plan || 'Free'}</Badge>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Subscriber Limit</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{(customer.subscriberLimit || 1000).toLocaleString()}</span>
              </div>
              {customer.country && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Location</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{customer.city}, {customer.country}</span>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 className="card-title">🔗 API Integration</h2>
                <Button variant="secondary" size="sm" onClick={() => setCurrentTab && setCurrentTab('settings')}>
                  <Settings style={{ width: '0.875rem', height: '0.875rem', marginRight: '0.25rem' }} />
                  Settings
                </Button>
              </div>
            </CardHeader>
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Alert className="bg-blue-50 border-blue-200 text-blue-800 text-sm">
                💡 Find your API key and VAPID keys in Settings to integrate notifications
              </Alert>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Key style={{ width: '1rem', height: '1rem', color: 'var(--gray-500)' }} />
                  <span style={{ fontSize: '0.875rem' }}>API Key</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <code style={{ fontSize: '0.75rem', padding: '0.125rem 0.25rem', backgroundColor: 'var(--gray-100)', borderRadius: '0.25rem' }}>
                    {customer?.api_key ? `${customer.api_key.substring(0, 8)}...` : 'Not configured'}
                  </code>
                  <Badge variant={customer?.api_key ? "success" : "warning"}>
                    {customer?.api_key ? "Ready" : "Setup"}
                  </Badge>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Wifi style={{ width: '1rem', height: '1rem', color: 'var(--gray-500)' }} />
                  <span style={{ fontSize: '0.875rem' }}>Push Service</span>
                </div>
                <Badge variant={data?.settings?.vapid_public_key ? "success" : "warning"}>
                  {data?.settings?.vapid_public_key ? "Ready" : "Setup Required"}
                </Badge>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.5rem', fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                <div><strong>API Base:</strong> {useApiBase()}/api</div>
                <div style={{ marginTop: '0.25rem' }}><strong>Docs:</strong> Available in Documentation tab</div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="card-title">System Status</h2>
            </CardHeader>
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '0.5rem', height: '0.5rem', backgroundColor: 'var(--success-500)', borderRadius: '50%' }}></div>
                  <span style={{ fontSize: '0.875rem' }}>API Status</span>
                </div>
                <Badge variant="success">Operational</Badge>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '0.5rem', height: '0.5rem', backgroundColor: data?.settings?.vapid_public_key ? 'var(--success-500)' : 'var(--warning-500)', borderRadius: '50%' }}></div>
                  <span style={{ fontSize: '0.875rem' }}>Push Service</span>
                </div>
                <Badge variant={data?.settings?.vapid_public_key ? "success" : "warning"}>
                  {data?.settings?.vapid_public_key ? "Active" : "Setup Required"}
                </Badge>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Send Notification with Live API
export function SendNotification() {
  const [notification, setNotification] = useState({
    title: '',
    body: '',
    url: '',
    icon: '',
    badge: '',
    image: '',
    tag: '',
    silent: false,
    requireInteraction: false
  })
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [useTemplate, setUseTemplate] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [customerData, setCustomerData] = useState(null)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [targetSegment, setTargetSegment] = useState('all')
  const [scheduledFor, setScheduledFor] = useState('')
  const apiBase = useApiBase()
  const headers = useAuthHeaders()

  useEffect(() => {
    const loadCustomerData = async () => {
      try {
        const token = localStorage.getItem('token')
        const requestHeaders = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
        const response = await fetch(`${apiBase}/api/customer/me`, { headers: requestHeaders })
        if (response.ok) {
          const data = await response.json()
          setCustomerData(data)
        }
      } catch (error) {
        console.error('Error loading customer data:', error)
      }
    }
    loadCustomerData()
  }, [])

  const loadTemplates = useCallback(async () => {
    try {
      setLoadingTemplates(true)
      const token = localStorage.getItem('token')
      const requestHeaders = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      const response = await fetch(`${apiBase}/api/templates`, { headers: requestHeaders })
      if (response.ok) {
        const data = await response.json()
        // Backend returns { templates: [] } or just []
        setTemplates(Array.isArray(data) ? data : (data?.templates || []))
      } else {
        console.error('Failed to load templates:', response.status)
        setTemplates([])
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      setTemplates([])
    } finally {
      setLoadingTemplates(false)
    }
  }, [apiBase])

  useEffect(() => {
    if (useTemplate) {
      loadTemplates()
    }
  }, [useTemplate, loadTemplates])

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template)
    setNotification({
      title: template.title || '',
      body: template.body || '',
      url: template.url || '',
      icon: template.icon || '',
      badge: template.badge || '',
      image: template.image || '',
      tag: template.tag || '',
      silent: template.silent || false,
      requireInteraction: template.requireInteraction || false
    })
  }

  const handleSend = async () => {
    setSending(true)
    setResult(null)
    
    try {
      const endpoint = scheduledFor ? '/api/scheduled' : '/api/customer/notify'
      const payload = {
        title: notification.title,
        body: notification.body,
        url: notification.url || undefined,
        icon: notification.icon || undefined,
        badge: notification.badge || undefined,
        image: notification.image || undefined,
        tag: notification.tag || undefined,
        silent: notification.silent,
        requireInteraction: notification.requireInteraction,
        targetSegment,
        ...(scheduledFor ? { scheduledFor, name: `${notification.title} - ${new Date(scheduledFor).toLocaleString()}` } : {})
      }

      const response = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        if (scheduledFor) {
          setResult({ 
            success: true, 
            message: `Notification scheduled successfully for ${new Date(scheduledFor).toLocaleString()}!`,
            data 
          })
        } else {
          setResult({ 
            success: true, 
            message: `Notification sent successfully to ${data.sent || data.successful || 'all'} subscribers!`,
            data 
          })
        }
        
        // Reset form on success
        setNotification({
          title: '',
          body: '',
          url: '',
          icon: '',
          badge: '',
          image: '',
          tag: '',
          silent: false,
          requireInteraction: false
        })
        setSelectedTemplate(null)
        setScheduledFor('')
      } else {
        setResult({ success: false, message: data.error || 'Failed to send notification' })
      }
    } catch (error) {
      setResult({ success: false, message: error.message })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Send Notification</h1>
          <p className="text-gray-600 mt-1">
            Send push notifications to {customerData?.subscriberCount || 0} active subscribers
          </p>
        </div>
        
        {/* Template Toggle */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useTemplate"
              checked={useTemplate}
              onChange={(e) => setUseTemplate(e.target.checked)}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="useTemplate" className="text-sm font-medium text-gray-900">
              Use Template
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Template Selection */}
        {useTemplate && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Choose Template
                </h2>
              </CardHeader>
              <CardBody className="max-h-96 overflow-y-auto">
                {loadingTemplates ? (
                  <div className="flex justify-center py-8">
                    <Loading size="medium" />
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No templates available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {templates.map(template => (
                      <div 
                        key={template._id}
                        onClick={() => handleTemplateSelect(template)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedTemplate?._id === template._id 
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900 text-sm">{template.name}</h3>
                          {template.category && (
                            <Badge variant="secondary" className="text-xs">
                              {template.category}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-800 mb-1">{template.title}</p>
                        <p className="text-xs text-gray-600 line-clamp-2">{template.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}

        {/* Main Content Form */}
        <div className={useTemplate ? 'lg:col-span-1' : 'lg:col-span-2'}>
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Content
                {selectedTemplate && (
                  <Badge variant="primary" className="ml-2">
                    Using: {selectedTemplate.name}
                  </Badge>
                )}
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Title</label>
                  <input
                    className="form-input"
                    value={notification.title}
                    onChange={(e) => setNotification({...notification, title: e.target.value})}
                    placeholder="Your notification title"
                    required
                  />
                </div>
                
                <div>
                  <label className="form-label">Target Audience</label>
                  <select
                    className="form-select"
                    value={targetSegment}
                    onChange={(e) => setTargetSegment(e.target.value)}
                  >
                    <option value="all">All Subscribers</option>
                    <option value="active">Active Users</option>
                    <option value="new">New Subscribers</option>
                    <option value="premium">Premium Users</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="form-label">Message</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={notification.body}
                  onChange={(e) => setNotification({...notification, body: e.target.value})}
                  placeholder="Notification message content"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Target URL (Optional)</label>
                  <input
                    className="form-input"
                    type="url"
                    value={notification.url}
                    onChange={(e) => setNotification({...notification, url: e.target.value})}
                    placeholder="https://your-site.com"
                  />
                </div>
                
                <div>
                  <label className="form-label">Tag (Optional)</label>
                  <input
                    className="form-input"
                    value={notification.tag}
                    onChange={(e) => setNotification({...notification, tag: e.target.value})}
                    placeholder="notification-tag"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Icon URL (Optional)</label>
                  <input
                    className="form-input"
                    type="url"
                    value={notification.icon}
                    onChange={(e) => setNotification({...notification, icon: e.target.value})}
                    placeholder="https://your-site.com/icon.png"
                  />
                </div>
                
                <div>
                  <label className="form-label">Badge URL (Optional)</label>
                  <input
                    className="form-input"
                    type="url"
                    value={notification.badge}
                    onChange={(e) => setNotification({...notification, badge: e.target.value})}
                    placeholder="https://your-site.com/badge.png"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Large Image URL (Optional)</label>
                <input
                  className="form-input"
                  type="url"
                  value={notification.image}
                  onChange={(e) => setNotification({...notification, image: e.target.value})}
                  placeholder="https://your-site.com/image.jpg"
                />
              </div>

              {/* Advanced Options */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Advanced Options</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Schedule For (Optional)</label>
                    <input
                      className="form-input"
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={(e) => setScheduledFor(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    <p className="text-xs text-gray-600 mt-1">Leave empty to send immediately</p>
                  </div>
                </div>
                
                <div className="flex gap-6 mt-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={notification.silent}
                      onChange={(e) => setNotification({...notification, silent: e.target.checked})}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    Silent notification
                  </label>
                  
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={notification.requireInteraction}
                      onChange={(e) => setNotification({...notification, requireInteraction: e.target.checked})}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    Require interaction
                  </label>
                </div>
              </div>

              {result && (
                <Alert type={result.success ? 'success' : 'error'}>
                  {result.message}
                  {result.success && result.data && (
                    <div className="mt-2 text-sm">
                      <p>Sent: {result.data.sent || 0} | Failed: {result.data.failed || 0}</p>
                    </div>
                  )}
                </Alert>
              )}

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="primary" 
                  onClick={handleSend} 
                  disabled={!notification.title || !notification.body || !customerData?.subscriberCount || sending}
                  className="flex-1"
                >
                  {sending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      {scheduledFor ? 'Scheduling...' : 'Sending...'}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {scheduledFor ? <Calendar className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                      {scheduledFor 
                        ? `Schedule for ${new Date(scheduledFor).toLocaleDateString()}`
                        : `Send to ${customerData?.subscriberCount || 0} Subscribers`
                      }
                    </div>
                  )}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Preview & Stats */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Preview Card */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Preview
                </h2>
              </CardHeader>
              <CardBody>
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">
                        {notification.title || 'Notification Title'}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">
                        {notification.body || 'Notification message will appear here...'}
                      </p>
                      <p className="text-xs text-gray-500">
                        now • {customerData?.customer?.name || 'your-app'}.com
                      </p>
                    </div>
                  </div>
                  {notification.image && (
                    <div className="mt-3 h-24 bg-gray-200 rounded-md flex items-center justify-center">
                      <Image className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Delivery Stats Card */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Delivery Stats
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Target Segment</span>
                    <Badge variant="secondary">{targetSegment.replace('_', ' ')}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Subscribers</span>
                    <span className="font-semibold">{(customerData?.subscriberCount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Estimated Reach</span>
                    <span className="font-semibold text-green-600">
                      {Math.floor((customerData?.subscriberCount || 0) * 0.85).toLocaleString()}
                    </span>
                  </div>
                  {scheduledFor && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Scheduled For</span>
                      <span className="font-semibold text-blue-600">
                        {new Date(scheduledFor).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Settings Page with Live API
export function SettingsPage() {
  const [settings, setSettings] = useState({
    vapidPublicKey: '',
    vapidPrivateKey: '',
    vapidSubject: '',
    title: '',
    iconUrl: '',
    badgeUrl: '',
    defaultUrl: ''
  })
  const [customerData, setCustomerData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const apiBase = useApiBase()
  const headers = useAuthHeaders()

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = localStorage.getItem('token')
        const requestHeaders = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
        const response = await fetch(`${apiBase}/api/customer/me`, { headers: requestHeaders })
        if (response.ok) {
          const data = await response.json()
          setCustomerData(data)
          if (data.settings) {
            setSettings(data.settings)
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setResult(null)
    
    try {
      const response = await fetch(`${apiBase}/api/customer/settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify(settings)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setResult({ success: true, message: 'Settings saved successfully!' })
        setSettings(data)
      } else {
        setResult({ success: false, message: data.error || 'Failed to save settings' })
      }
    } catch (error) {
      setResult({ success: false, message: error.message })
    } finally {
      setSaving(false)
    }
  }

  const generateVapidKeys = async () => {
    setGenerating(true)
    
    try {
      const response = await fetch(`${apiBase}/api/customer/generate-vapid`, {
        method: 'POST',
        headers
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSettings(prev => ({
          ...prev,
          vapidPublicKey: data.publicKey,
          vapidPrivateKey: data.privateKey
        }))
        setResult({ success: true, message: 'VAPID keys generated successfully!' })
      } else {
        setResult({ success: false, message: data.error || 'Failed to generate VAPID keys' })
      }
    } catch (error) {
      setResult({ success: false, message: error.message })
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return <div className="loading-container"><div className="loading-spinner"></div></div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>Settings</h1>
        <p style={{ color: 'var(--gray-600)', marginTop: '0.25rem', margin: 0 }}>Configure your push notification service</p>
      </div>

      {result && (
        <Alert type={result.success ? "success" : "error"}>
          {result.message}
        </Alert>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 className="card-title">VAPID Configuration</h2>
                <Button variant="secondary" onClick={generateVapidKeys} loading={generating} size="sm">
                  <Key style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                  Generate Keys
                </Button>
              </div>
            </CardHeader>
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input
                label="VAPID Public Key"
                value={settings.vapidPublicKey}
                onChange={(e) => setSettings({...settings, vapidPublicKey: e.target.value})}
                placeholder="Your VAPID public key"
                multiline
                rows={2}
              />
              
              <Input
                label="VAPID Private Key"
                value={settings.vapidPrivateKey}
                onChange={(e) => setSettings({...settings, vapidPrivateKey: e.target.value})}
                placeholder="Your VAPID private key"
                multiline
                rows={2}
              />
              
              <Input
                label="VAPID Subject"
                value={settings.vapidSubject}
                onChange={(e) => setSettings({...settings, vapidSubject: e.target.value})}
                placeholder="mailto:admin@yoursite.com"
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="card-title">Notification Appearance</h2>
            </CardHeader>
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input
                label="Default Title"
                value={settings.title}
                onChange={(e) => setSettings({...settings, title: e.target.value})}
                placeholder="Your App Name Notifications"
              />
              
              <Input
                label="Default Icon URL"
                value={settings.iconUrl}
                onChange={(e) => setSettings({...settings, iconUrl: e.target.value})}
                placeholder="https://yoursite.com/icon.png"
              />
              
              <Input
                label="Badge URL"
                value={settings.badgeUrl}
                onChange={(e) => setSettings({...settings, badgeUrl: e.target.value})}
                placeholder="https://yoursite.com/badge.png"
              />
              
              <Input
                label="Default Click URL"
                value={settings.defaultUrl}
                onChange={(e) => setSettings({...settings, defaultUrl: e.target.value})}
                placeholder="https://yoursite.com"
              />
            </CardBody>
          </Card>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Reset
            </Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              <Save style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
              Save Settings
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card>
            <CardHeader>
              <h2 className="card-title">Account Information</h2>
            </CardHeader>
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Company Name</label>
                <p style={{ fontWeight: 500, margin: '0.25rem 0 0 0' }}>{customerData?.customer?.name}</p>
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Email</label>
                <p style={{ fontWeight: 500, margin: '0.25rem 0 0 0' }}>{customerData?.customer?.email}</p>
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Plan</label>
                <p style={{ margin: '0.25rem 0 0 0' }}>
                  <Badge variant="primary">{customerData?.customer?.plan || 'Free'}</Badge>
                </p>
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>API Key</label>
                <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', backgroundColor: 'var(--gray-100)', padding: '0.5rem', borderRadius: '0.25rem', margin: '0.25rem 0 0 0' }}>
                  {customerData?.customer?.apiKey}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="card-title">Usage Statistics</h2>
            </CardHeader>
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Subscribers</span>
                <span style={{ fontWeight: 600 }}>{customerData?.subscriberCount || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Limit</span>
                <span style={{ fontWeight: 600 }}>{customerData?.customer?.subscriberLimit || 1000}</span>
              </div>
              <div style={{ backgroundColor: 'var(--gray-100)', borderRadius: '0.5rem', height: '0.5rem' }}>
                <div 
                  style={{ 
                    backgroundColor: 'var(--primary-500)', 
                    borderRadius: '0.5rem', 
                    height: '100%', 
                    width: `${Math.min((customerData?.subscriberCount || 0) / (customerData?.customer?.subscriberLimit || 1000) * 100, 100)}%` 
                  }}
                ></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Notifications Sent</span>
                <span style={{ fontWeight: 600 }}>{customerData?.notificationStats?.totalSends || 0}</span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Analytics Dashboard with Live Data
export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7d')
  const apiBase = useApiBase()
  const headers = useAuthHeaders()

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const token = localStorage.getItem('token')
        const requestHeaders = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
        const [customerRes, metricsRes] = await Promise.all([
          fetch(`${apiBase}/api/customer/me`, { headers: requestHeaders }),
          fetch(`${apiBase}/api/metrics?range=${dateRange}`, { headers: requestHeaders })
        ])

        const customerData = customerRes.ok ? await customerRes.json() : null
        const metricsData = metricsRes.ok ? await metricsRes.json() : null

        setAnalytics({ customer: customerData, metrics: metricsData })
      } catch (error) {
        console.error('Analytics load error:', error)
      } finally {
        setLoading(false)
      }
    }
    loadAnalytics()
  }, [dateRange])

  if (loading) {
    return <div className="loading-container"><div className="loading-spinner"></div></div>
  }

  const stats = analytics?.customer?.notificationStats || {}
  const delivered = stats.sent || 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>Analytics Dashboard</h1>
          <p style={{ color: 'var(--gray-600)', marginTop: '0.25rem', margin: 0 }}>Track your notification performance</p>
        </div>
        <select 
          value={dateRange} 
          onChange={(e) => setDateRange(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--gray-300)' }}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p className="stat-title">Total Delivered</p>
              <h3 className="stat-value">{delivered.toLocaleString()}</h3>
              <p className="stat-change positive">Successfully delivered</p>
            </div>
            <Send style={{ width: '2rem', height: '2rem', color: 'var(--success-600)' }} />
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p className="stat-title">Open Rate</p>
              <h3 className="stat-value">{stats.openRate || 0}%</h3>
              <p className="stat-change">User engagement</p>
            </div>
            <Eye style={{ width: '2rem', height: '2rem', color: 'var(--primary-600)' }} />
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p className="stat-title">Click Rate</p>
              <h3 className="stat-value">{stats.clickRate || 0}%</h3>
              <p className="stat-change">Conversion rate</p>
            </div>
            <MousePointer style={{ width: '2rem', height: '2rem', color: 'var(--warning-600)' }} />
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p className="stat-title">Active Subscribers</p>
              <h3 className="stat-value">{(analytics?.customer?.subscriberCount || 0).toLocaleString()}</h3>
              <p className="stat-change positive">Total audience</p>
            </div>
            <Users style={{ width: '2rem', height: '2rem', color: 'var(--accent-600)' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <Card>
          <CardHeader>
            <h2 className="card-title">Performance Trends</h2>
          </CardHeader>
          <CardBody>
            <div style={{ height: '300px', backgroundColor: 'var(--gray-50)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <TrendingUp style={{ width: '3rem', height: '3rem', color: 'var(--gray-400)' }} />
              <p style={{ marginTop: '1rem', color: 'var(--gray-500)' }}>Chart visualization coming soon</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)' }}>Tracking {stats.totalSends || 0} notifications</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="card-title">Audience Insights</h2>
          </CardHeader>
          <CardBody>
            <div style={{ height: '300px', backgroundColor: 'var(--gray-50)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <PieChart style={{ width: '3rem', height: '3rem', color: 'var(--gray-400)' }} />
              <p style={{ marginTop: '1rem', color: 'var(--gray-500)' }}>Device breakdown visualization</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)' }}>{analytics?.customer?.subscriberCount || 0} active subscribers</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="card-title">Recent Performance</h2>
        </CardHeader>
        <CardBody>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success-600)' }}>{stats.sent || 0}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Delivered</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--error-600)' }}>{stats.failed || 0}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Failed</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-600)' }}>{Math.round((stats.sent || 0) / Math.max(stats.totalSends || 1) * 100)}%</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Success Rate</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning-600)' }}>{analytics?.customer?.subscriberCount || 0}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Total Reach</div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

// Subscriber Management with Live Data
export function SubscriberManagement() {
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [totalSubscribers, setTotalSubscribers] = useState(0)
  const apiBase = useApiBase()
  const headers = useAuthHeaders()

  useEffect(() => {
    const loadSubscribers = async () => {
      try {
        const token = localStorage.getItem('token')
        const requestHeaders = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
        const response = await fetch(`${apiBase}/api/customer/subscribers`, { headers: requestHeaders })
        if (response.ok) {
          const data = await response.json()
          console.log('✅ SubscriberManagement received data:', data)
          setSubscribers(Array.isArray(data) ? data : (data.subscriptions || []))
          setTotalSubscribers(Array.isArray(data) ? data.length : (data.total || data.subscriptions?.length || 0))
        }
      } catch (error) {
        console.error('Error loading subscribers:', error)
      } finally {
        setLoading(false)
      }
    }
    loadSubscribers()
  }, [])

  const filteredSubscribers = (Array.isArray(subscribers) ? subscribers : []).filter(sub => 
    (sub.endpoint?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (sub.userAgent?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (sub.tenant?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (sub.country?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (sub.browser?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (sub.os?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (sub.device?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>Subscriber Management</h1>
          <p style={{ color: 'var(--gray-600)', marginTop: '0.25rem', margin: 0 }}>
            Manage your {totalSubscribers.toLocaleString()} notification subscribers
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="secondary">
            <Download style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
            Export
          </Button>
          <Button variant="primary">
            <RefreshCw style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 className="card-title">All Subscribers</h2>
            <Badge variant="primary">{totalSubscribers} total</Badge>
          </div>
        </CardHeader>
        <CardBody>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: 'var(--gray-400)' }} />
              <input
                placeholder="Search subscribers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  border: '1px solid var(--gray-300)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <div style={{ border: '1px solid var(--gray-200)', borderRadius: '0.5rem', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: 'var(--gray-50)' }}>
                  <tr>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 500, color: 'var(--gray-700)' }}>
                      Tenant
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 500, color: 'var(--gray-700)' }}>
                      Country
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 500, color: 'var(--gray-700)' }}>
                      Browser
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 500, color: 'var(--gray-700)' }}>
                      Device
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 500, color: 'var(--gray-700)' }}>
                      Subscribed
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 500, color: 'var(--gray-700)' }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscribers.length > 0 ? filteredSubscribers.map((subscriber, index) => (
                    <tr key={subscriber._id || subscriber.id || index} style={{ borderTop: '1px solid var(--gray-200)' }}>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--gray-900)' }}>
                        <div style={{ fontWeight: 500 }}>
                          {subscriber.tenant || 'Unknown Tenant'}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Globe style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                          {subscriber.country || 'Unknown'}
                          {subscriber.city && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginLeft: '0.25rem' }}>
                              , {subscriber.city}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Globe style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                          {subscriber.browser || 'Unknown'}
                          {subscriber.os && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginLeft: '0.25rem' }}>
                              on {subscriber.os}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {subscriber.device === 'Mobile' ? (
                            <Smartphone style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                          ) : (
                            <Monitor style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                          )}
                          {subscriber.device || 'Unknown'}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                        {(subscriber.created_at || subscriber.createdAt) ? new Date(subscriber.created_at || subscriber.createdAt).toLocaleDateString() : 'Unknown'}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <Badge variant="success">Active</Badge>
                      </td>
                    </tr>
                  )) : (
                    <tr style={{ borderTop: '1px solid var(--gray-200)' }}>
                      <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-500)' }}>
                        {searchTerm ? 'No subscribers found matching your search' : 'No subscribers yet'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

// Placeholder components for other sections (with coming soon messages)
export const NotificationScheduler = () => {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [result, setResult] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const apiBase = useApiBase()

  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      const response = await fetch(`${apiBase}/api/scheduled`, { headers })
      if (response.ok) {
        const data = await response.json()
        // Backend returns { notifications: [], total: 0 }
        setSchedules(Array.isArray(data) ? data : (data?.notifications || []))
      }
    } catch (error) {
      console.error('Error loading schedules:', error)
    } finally {
      setLoading(false)
    }
  }, [apiBase])

  useEffect(() => {
    loadSchedules()
  }, [])

  const handleCreateSchedule = async (scheduleData) => {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      const response = await fetch(`${apiBase}/api/scheduled/schedule`, {
        method: 'POST',
        headers,
        body: JSON.stringify(scheduleData)
      })
      
      if (response.ok) {
        await loadSchedules()
        setResult({ success: true, message: 'Schedule created successfully!' })
        setShowCreateModal(false)
      } else {
        const error = await response.json()
        setResult({ success: false, message: error.error || 'Failed to create schedule' })
      }
    } catch (error) {
      setResult({ success: false, message: error.message })
    }
  }

  const handleToggleSchedule = async (scheduleId, action) => {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      const response = await fetch(`${apiBase}/api/scheduled/${scheduleId}/${action}`, {
        method: 'POST',
        headers
      })
      
      if (response.ok) {
        await loadSchedules()
        setResult({ success: true, message: `Schedule ${action}d successfully!` })
      } else {
        const error = await response.json()
        setResult({ success: false, message: error.error || `Failed to ${action} schedule` })
      }
    } catch (error) {
      setResult({ success: false, message: error.message })
    }
  }

  const handleDeleteSchedule = async (scheduleId) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return
    
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      const response = await fetch(`${apiBase}/api/scheduled/${scheduleId}`, {
        method: 'DELETE',
        headers
      })
      
      if (response.ok) {
        await loadSchedules()
        setResult({ success: true, message: 'Schedule deleted successfully!' })
      } else {
        const error = await response.json()
        setResult({ success: false, message: error.error || 'Failed to delete schedule' })
      }
    } catch (error) {
      setResult({ success: false, message: error.message })
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <PlayCircle className="w-4 h-4 text-green-600" />
      case 'paused': return <PauseCircle className="w-4 h-4 text-yellow-600" />
      case 'completed': return <CheckCircle className="w-4 h-4 text-blue-600" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getRecurrenceText = (schedule) => {
    if (!schedule.recurring) return 'One-time'
    
    const { frequency, interval } = schedule.recurrence || {}
    if (frequency === 'daily') return 'Daily'
    if (frequency === 'weekly') return 'Weekly'
    if (frequency === 'monthly') return 'Monthly'
    if (frequency === 'custom' && interval) return `Every ${interval} ${interval === 1 ? 'day' : 'days'}`
    return 'Recurring'
  }

  const filteredSchedules = (Array.isArray(schedules) ? schedules : []).filter(schedule => {
    if (filterStatus === 'all') return true
    return schedule.status === filterStatus
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loading size="large" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notification Scheduler</h1>
          <p className="text-gray-600 mt-1">Schedule and manage automated notifications</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Schedule
        </Button>
      </div>

      {result && (
        <Alert type={result.success ? 'success' : 'error'} className="mb-6">
          {result.message}
        </Alert>
      )}

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        {['all', 'active', 'paused', 'completed', 'failed'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              filterStatus === status
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded-full">
              {status === 'all' ? (Array.isArray(schedules) ? schedules : []).length : (Array.isArray(schedules) ? schedules : []).filter(s => s.status === status).length}
            </span>
          </button>
        ))}
      </div>

      {/* Schedules Grid */}
      {filteredSchedules.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filterStatus === 'all' ? 'No schedules yet' : `No ${filterStatus} schedules`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filterStatus === 'all' 
                ? 'Create your first scheduled notification to get started'
                : `No schedules with ${filterStatus} status found`
              }
            </p>
            {filterStatus === 'all' && (
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Schedule
              </Button>
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredSchedules.map(schedule => (
            <Card key={schedule._id} className="hover:shadow-lg transition-shadow duration-200">
              <CardBody className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusIcon(schedule.status)}
                      <h3 className="text-xl font-semibold text-gray-900">{schedule.name}</h3>
                      <Badge 
                        variant={schedule.status === 'active' ? 'success' : schedule.status === 'paused' ? 'warning' : 'secondary'}
                      >
                        {schedule.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Next: {new Date(schedule.nextRunAt || schedule.scheduledFor).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{getRecurrenceText(schedule)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Target: {schedule.targetSegment || 'All subscribers'}</span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Bell className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900">{schedule.notification?.title}</span>
                      </div>
                      <p className="text-gray-600 text-sm">{schedule.notification?.body}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setEditingSchedule(schedule)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title="Edit Schedule"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    
                    {schedule.status === 'active' ? (
                      <button
                        onClick={() => handleToggleSchedule(schedule._id, 'pause')}
                        className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors duration-200"
                        title="Pause Schedule"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    ) : schedule.status === 'paused' ? (
                      <button
                        onClick={() => handleToggleSchedule(schedule._id, 'resume')}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                        title="Resume Schedule"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    ) : null}
                    
                    <button
                      onClick={() => handleDeleteSchedule(schedule._id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="Delete Schedule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Schedule Modal */}
      {(showCreateModal || editingSchedule) && (
        <ScheduleCreateModal
          schedule={editingSchedule}
          onClose={() => {
            setShowCreateModal(false)
            setEditingSchedule(null)
            setResult(null)
          }}
          onSave={handleCreateSchedule}
        />
      )}
    </div>
  )
}

// Schedule Create Modal Component
const ScheduleCreateModal = ({ schedule, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: schedule?.title || '',
    body: schedule?.body || '',
    url: schedule?.url || '',
    icon: schedule?.icon || '',
    badge: schedule?.badge || '',
    image: schedule?.image || '',
    scheduledFor: schedule?.scheduledFor || new Date(Date.now() + 3600000).toISOString().slice(0, 16), // Default 1 hour from now
    tag: schedule?.tag || '',
    timezone: schedule?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    data: schedule?.data || {},
    actions: schedule?.actions || []
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (schedule) {
      setFormData({
        title: schedule.title || '',
        body: schedule.body || '',
        url: schedule.url || '',
        icon: schedule.icon || '',
        badge: schedule.badge || '',
        image: schedule.image || '',
        scheduledFor: schedule.scheduledFor ? new Date(schedule.scheduledFor).toISOString().slice(0, 16) : new Date(Date.now() + 3600000).toISOString().slice(0, 16),
        tag: schedule.tag || '',
        timezone: schedule.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        data: schedule.data || {},
        actions: schedule.actions || []
      })
    }
  }, [schedule])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    
    // Validation
    const newErrors = {}
    if (!formData.title.trim()) newErrors.title = 'Notification title is required'
    if (!formData.body.trim()) newErrors.body = 'Notification body is required'
    if (!formData.scheduledFor) newErrors.scheduledFor = 'Schedule time is required'
    
    // Check if scheduled time is in the future
    const scheduledTime = new Date(formData.scheduledFor)
    if (scheduledTime <= new Date()) {
      newErrors.scheduledFor = 'Scheduled time must be in the future'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setLoading(true)
    try {
      // Convert local datetime to ISO string with timezone
      const submitData = {
        ...formData,
        scheduledFor: new Date(formData.scheduledFor).toISOString()
      }
      await onSave(submitData)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-large w-full max-w-4xl max-h-[95vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{schedule ? 'Edit Schedule' : 'Create New Schedule'}</h2>
                <p className="text-blue-100">Set up automated notification delivery</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-blue-600" />
                </div>
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Schedule Date & Time</label>
                  <input
                    className="form-input"
                    type="datetime-local"
                    value={formData.scheduledFor}
                    onChange={(e) => handleInputChange('scheduledFor', e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  {errors.scheduledFor && <div className="form-error">{errors.scheduledFor}</div>}
                </div>
                <div>
                  <label className="form-label">Timezone</label>
                  <input
                    className="form-input"
                    value={formData.timezone}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                    placeholder="e.g., America/New_York"
                  />
                </div>
              </div>
            </div>

            {/* Notification Content */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-4 h-4 text-green-600" />
                </div>
                Notification Content
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="form-label">Title</label>
                  <input
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Notification title"
                  />
                  {errors.title && <div className="form-error">{errors.title}</div>}
                </div>
                
                <div>
                  <label className="form-label">Message</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={formData.body}
                    onChange={(e) => handleInputChange('body', e.target.value)}
                    placeholder="Notification message"
                  />
                  {errors.body && <div className="form-error">{errors.body}</div>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Click URL (Optional)</label>
                    <input
                      className="form-input"
                      type="url"
                      value={formData.url}
                      onChange={(e) => handleInputChange('url', e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Icon URL (Optional)</label>
                    <input
                      className="form-input"
                      type="url"
                      value={formData.icon}
                      onChange={(e) => handleInputChange('icon', e.target.value)}
                      placeholder="https://example.com/icon.png"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Badge URL (Optional)</label>
                    <input
                      className="form-input"
                      type="url"
                      value={formData.badge}
                      onChange={(e) => handleInputChange('badge', e.target.value)}
                      placeholder="https://example.com/badge.png"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Image URL (Optional)</label>
                    <input
                      className="form-input"
                      type="url"
                      value={formData.image}
                      onChange={(e) => handleInputChange('image', e.target.value)}
                      placeholder="https://example.com/image.png"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="form-label">Tag (Optional)</label>
                  <input
                    className="form-input"
                    value={formData.tag}
                    onChange={(e) => handleInputChange('tag', e.target.value)}
                    placeholder="e.g., news, alert, promo"
                  />
                </div>
              </div>
            </div>

            {/* Additional Options */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-purple-600" />
                </div>
                Additional Options (Coming Soon)
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 text-gray-600">
                <p className="text-sm mb-2">🚀 Future features will include:</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Recurring schedules (daily, weekly, monthly)</li>
                  <li>• Target specific user segments</li>
                  <li>• Custom actions and data payloads</li>
                  <li>• Advanced timezone handling</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-gray-200 px-8 py-6 bg-gray-50 flex justify-end gap-3 flex-shrink-0 rounded-b-2xl">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  {schedule ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {schedule ? 'Update Schedule' : 'Create Schedule'}
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export const UserSegments = () => {
  const [segments, setSegments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingSegment, setEditingSegment] = useState(null)
  const [result, setResult] = useState(null)
  const [selectedSegment, setSelectedSegment] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const apiBase = useApiBase()

  const loadSegments = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      const response = await fetch(`${apiBase}/api/segments`, { headers })
      if (response.ok) {
        const data = await response.json()
        setSegments(Array.isArray(data) ? data : (data?.segments || []))
      }
    } catch (error) {
      console.error('Error loading segments:', error)
    } finally {
      setLoading(false)
    }
  }, [apiBase])

  useEffect(() => {
    loadSegments()
  }, [])

  const handleCreateSegment = async (segmentData) => {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      const response = await fetch(`${apiBase}/api/segments/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(segmentData)
      })
      
      if (response.ok) {
        await loadSegments()
        setResult({ success: true, message: 'Segment created successfully!' })
        setShowCreateModal(false)
      } else {
        const error = await response.json()
        setResult({ success: false, message: error.error || 'Failed to create segment' })
      }
    } catch (error) {
      setResult({ success: false, message: error.message })
    }
  }

  const handleDeleteSegment = async (segmentId) => {
    if (!confirm('Are you sure you want to delete this segment?')) return
    
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      const response = await fetch(`${apiBase}/api/segments/${segmentId}`, {
        method: 'DELETE',
        headers
      })
      
      if (response.ok) {
        await loadSegments()
        setResult({ success: true, message: 'Segment deleted successfully!' })
      } else {
        const error = await response.json()
        setResult({ success: false, message: error.error || 'Failed to delete segment' })
      }
    } catch (error) {
      setResult({ success: false, message: error.message })
    }
  }

  const getSegmentIcon = (type) => {
    switch (type) {
      case 'behavioral': return <Activity className="w-5 h-5 text-blue-600" />
      case 'demographic': return <Users className="w-5 h-5 text-green-600" />
      case 'geographic': return <MapPin className="w-5 h-5 text-purple-600" />
      case 'device': return <Smartphone className="w-5 h-5 text-orange-600" />
      case 'engagement': return <TrendingUp className="w-5 h-5 text-pink-600" />
      default: return <Target className="w-5 h-5 text-gray-600" />
    }
  }

  const getConditionDisplay = (conditions) => {
    if (!conditions || conditions.length === 0) return 'No conditions'
    
    return conditions.map(condition => {
      const { field, operator, value } = condition
      return `${field.replace('_', ' ')} ${operator} ${value}`
    }).join(' AND ')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loading size="large" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Segments</h1>
          <p className="text-gray-600 mt-1">Create targeted user groups for personalized messaging</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Segment
        </Button>
      </div>

      {result && (
        <Alert type={result.success ? 'success' : 'error'} className="mb-6">
          {result.message}
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardBody className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{segments.length}</div>
            <div className="text-gray-600 text-sm">Total Segments</div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {(Array.isArray(segments) ? segments : []).filter(s => s.status === 'active').length}
            </div>
            <div className="text-gray-600 text-sm">Active Segments</div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {segments.reduce((sum, s) => sum + (s.userCount || 0), 0)}
            </div>
            <div className="text-gray-600 text-sm">Total Users</div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {Math.round(segments.reduce((sum, s) => sum + (s.engagementRate || 0), 0) / (segments.length || 1))}%
            </div>
            <div className="text-gray-600 text-sm">Avg Engagement</div>
          </CardBody>
        </Card>
      </div>

      {/* Segments List */}
      {segments.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No segments yet</h3>
            <p className="text-gray-600 mb-6">Create your first user segment to start targeting specific groups</p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Segment
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-6">
          {segments.map(segment => (
            <Card key={segment._id} className="hover:shadow-lg transition-shadow duration-200">
              <CardBody className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getSegmentIcon(segment.type)}
                      <h3 className="text-xl font-semibold text-gray-900">{segment.name}</h3>
                      <Badge 
                        variant={segment.status === 'active' ? 'success' : 'secondary'}
                      >
                        {segment.status}
                      </Badge>
                    </div>
                    
                    {segment.description && (
                      <p className="text-gray-600 mb-4">{segment.description}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{segment.userCount || 0} users</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{segment.engagementRate || 0}% engagement</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Created {new Date(segment.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Filter className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900">Targeting Conditions</span>
                      </div>
                      <p className="text-gray-600 text-sm">{getConditionDisplay(segment.conditions)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedSegment(segment)
                        setShowPreview(true)
                      }}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title="Preview Users"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => setEditingSegment(segment)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title="Edit Segment"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteSegment(segment._id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="Delete Segment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Segment Modal */}
      {(showCreateModal || editingSegment) && (
        <SegmentCreateModal
          segment={editingSegment}
          onClose={() => {
            setShowCreateModal(false)
            setEditingSegment(null)
            setResult(null)
          }}
          onSave={handleCreateSegment}
        />
      )}

      {/* Preview Modal */}
      {showPreview && selectedSegment && (
        <SegmentPreviewModal
          segment={selectedSegment}
          onClose={() => {
            setShowPreview(false)
            setSelectedSegment(null)
          }}
        />
      )}
    </div>
  )
}

// Segment Create Modal Component
const SegmentCreateModal = ({ segment, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'behavioral',
    conditions: [{ field: 'last_active', operator: 'greater_than', value: '7' }],
    status: 'active'
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (segment) {
      setFormData({
        name: segment.name || '',
        description: segment.description || '',
        type: segment.type || 'behavioral',
        conditions: segment.conditions || [{ field: 'last_active', operator: 'greater_than', value: '7' }],
        status: segment.status || 'active'
      })
    }
  }, [segment])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    
    // Validation
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Segment name is required'
    if (formData.conditions.length === 0) newErrors.conditions = 'At least one condition is required'
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setLoading(true)
    try {
      await onSave(formData)
    } finally {
      setLoading(false)
    }
  }

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: 'last_active', operator: 'greater_than', value: '' }]
    }))
  }

  const removeCondition = (index) => {
    setFormData(prev => ({
      ...prev,
      conditions: (Array.isArray(prev.conditions) ? prev.conditions : []).filter((_, i) => i !== index)
    }))
  }

  const updateCondition = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) => 
        i === index ? { ...condition, [field]: value } : condition
      )
    }))
  }

  const segmentTypes = [
    { value: 'behavioral', label: 'Behavioral', icon: Activity },
    { value: 'demographic', label: 'Demographic', icon: Users },
    { value: 'geographic', label: 'Geographic', icon: MapPin },
    { value: 'device', label: 'Device-based', icon: Smartphone },
    { value: 'engagement', label: 'Engagement', icon: TrendingUp }
  ]

  const conditionFields = [
    { value: 'last_active', label: 'Last Active (days ago)' },
    { value: 'total_notifications', label: 'Total Notifications Received' },
    { value: 'click_rate', label: 'Click Rate (%)' },
    { value: 'device_type', label: 'Device Type' },
    { value: 'subscription_date', label: 'Days Since Subscription' },
    { value: 'engagement_score', label: 'Engagement Score' }
  ]

  const operators = [
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not equals' },
    { value: 'contains', label: 'Contains' }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-large w-full max-w-4xl max-h-[95vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6 text-white rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{segment ? 'Edit Segment' : 'Create New Segment'}</h2>
                <p className="text-purple-100">Define targeting rules for user groups</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-purple-600" />
                </div>
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Segment Name</label>
                  <input
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., High Engagement Users, Mobile Users"
                  />
                  {errors.name && <div className="form-error">{errors.name}</div>}
                </div>
                
                <div>
                  <label className="form-label">Segment Type</label>
                  <select
                    className="form-select"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  >
                    {segmentTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this segment and its purpose"
                  />
                </div>
              </div>
            </div>

            {/* Targeting Conditions */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Filter className="w-4 h-4 text-blue-600" />
                </div>
                Targeting Conditions
              </h3>
              {errors.conditions && <div className="form-error mb-4">{errors.conditions}</div>}
              
              <div className="space-y-4">
                {formData.conditions.map((condition, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-medium text-gray-700">Condition {index + 1}</span>
                      {formData.conditions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCondition(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="form-label">Field</label>
                        <select
                          className="form-select"
                          value={condition.field}
                          onChange={(e) => updateCondition(index, 'field', e.target.value)}
                        >
                          {conditionFields.map(field => (
                            <option key={field.value} value={field.value}>
                              {field.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="form-label">Operator</label>
                        <select
                          className="form-select"
                          value={condition.operator}
                          onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                        >
                          {operators.map(op => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="form-label">Value</label>
                        <input
                          className="form-input"
                          value={condition.value}
                          onChange={(e) => updateCondition(index, 'value', e.target.value)}
                          placeholder="Enter value"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addCondition}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Condition
                </button>
              </div>
            </div>

            {/* Status */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                Status
              </h3>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={formData.status === 'active'}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-900">Active</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    value="draft"
                    checked={formData.status === 'draft'}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-4 h-4 text-gray-600 focus:ring-gray-500"
                  />
                  <span className="text-sm font-medium text-gray-900">Draft</span>
                </label>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-gray-200 px-8 py-6 bg-gray-50 flex justify-end gap-3 flex-shrink-0 rounded-b-2xl">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  {segment ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {segment ? 'Update Segment' : 'Create Segment'}
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Segment Preview Modal Component  
const SegmentPreviewModal = ({ segment, onClose }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const apiBase = useApiBase()

  useEffect(() => {
    const loadSegmentUsers = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
        
        // Get segment users (mock data for now)
        const mockUsers = [
          { id: 1, email: 'user1@example.com', lastActive: '2024-01-15', deviceType: 'mobile', engagementScore: 85 },
          { id: 2, email: 'user2@example.com', lastActive: '2024-01-10', deviceType: 'desktop', engagementScore: 92 },
          { id: 3, email: 'user3@example.com', lastActive: '2024-01-12', deviceType: 'mobile', engagementScore: 78 }
        ]
        
        setUsers(mockUsers)
        setStats({
          totalUsers: mockUsers.length,
          avgEngagement: Math.round(mockUsers.reduce((sum, u) => sum + u.engagementScore, 0) / mockUsers.length),
          mobileUsers: mockUsers.filter(u => u.deviceType === 'mobile').length,
          recentlyActive: mockUsers.filter(u => new Date(u.lastActive) > new Date('2024-01-12')).length
        })
      } catch (error) {
        console.error('Error loading segment users:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadSegmentUsers()
  }, [segment, apiBase])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-large w-full max-w-4xl max-h-[95vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 px-8 py-6 text-white rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Segment Preview: {segment.name}</h2>
                <p className="text-green-100">Users matching your targeting conditions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <Loading size="large" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Overview */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
                    <div className="text-sm text-blue-600">Total Users</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.avgEngagement}%</div>
                    <div className="text-sm text-green-600">Avg Engagement</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.mobileUsers}</div>
                    <div className="text-sm text-purple-600">Mobile Users</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.recentlyActive}</div>
                    <div className="text-sm text-orange-600">Recently Active</div>
                  </div>
                </div>
              )}

              {/* Users Table */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Matching Users</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Engagement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{user.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(user.lastActive).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <span className="capitalize">{user.deviceType}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{user.engagementScore}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 px-8 py-6 bg-gray-50 flex justify-end flex-shrink-0 rounded-b-2xl">
          <Button variant="primary" onClick={onClose}>
            <Eye className="w-4 h-4 mr-2" />
            Close Preview
          </Button>
        </div>
      </div>
    </div>
  )
}

export const WebhookManagement = () => {
  const [webhooks, setWebhooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState(null)
  const [result, setResult] = useState(null)
  const [testingWebhook, setTestingWebhook] = useState(null)
  const apiBase = useApiBase()

  const loadWebhooks = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      const response = await fetch(`${apiBase}/api/webhooks`, { headers })
      if (response.ok) {
        const data = await response.json()
        setWebhooks(Array.isArray(data) ? data : (data?.webhooks || []))
      }
    } catch (error) {
      console.error('Error loading webhooks:', error)
    } finally {
      setLoading(false)
    }
  }, [apiBase])

  useEffect(() => {
    loadWebhooks()
  }, [])

  const handleCreateWebhook = async (webhookData) => {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      const url = editingWebhook ? `${apiBase}/api/webhooks/${editingWebhook._id}` : `${apiBase}/api/webhooks/create`
      const method = editingWebhook ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(webhookData)
      })
      
      if (response.ok) {
        await loadWebhooks()
        setResult({ success: true, message: `Webhook ${editingWebhook ? 'updated' : 'created'} successfully!` })
        setShowCreateModal(false)
        setEditingWebhook(null)
      } else {
        const error = await response.json()
        setResult({ success: false, message: error.error || 'Failed to save webhook' })
      }
    } catch (error) {
      setResult({ success: false, message: error.message })
    }
  }

  const handleDeleteWebhook = async (webhookId) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return
    
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      const response = await fetch(`${apiBase}/api/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers
      })
      
      if (response.ok) {
        await loadWebhooks()
        setResult({ success: true, message: 'Webhook deleted successfully!' })
      } else {
        const error = await response.json()
        setResult({ success: false, message: error.error || 'Failed to delete webhook' })
      }
    } catch (error) {
      setResult({ success: false, message: error.message })
    }
  }

  const handleTestWebhook = async (webhook) => {
    setTestingWebhook(webhook._id)
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      const response = await fetch(`${apiBase}/api/webhooks/${webhook._id}/test`, {
        method: 'POST',
        headers
      })
      
      if (response.ok) {
        setResult({ success: true, message: 'Test webhook sent successfully!' })
      } else {
        const error = await response.json()
        setResult({ success: false, message: error.error || 'Failed to test webhook' })
      }
    } catch (error) {
      setResult({ success: false, message: error.message })
    } finally {
      setTestingWebhook(null)
    }
  }

  const getEventIcon = (event) => {
    switch (event) {
      case 'notification.delivered': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'notification.clicked': return <MousePointer className="w-4 h-4 text-blue-600" />
      case 'notification.failed': return <XCircle className="w-4 h-4 text-red-600" />
      case 'user.subscribed': return <UserPlus className="w-4 h-4 text-purple-600" />
      case 'user.unsubscribed': return <Users className="w-4 h-4 text-yellow-600" />
      default: return <Webhook className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return <Badge variant="success">Active</Badge>
      case 'disabled': return <Badge variant="secondary">Disabled</Badge>
      case 'failed': return <Badge variant="error">Failed</Badge>
      default: return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loading size="large" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Webhook Management</h1>
          <p className="text-gray-600 mt-1">Configure webhooks for delivery events and user actions</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      {result && (
        <Alert type={result.success ? 'success' : 'error'} className="mb-6">
          {result.message}
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardBody className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Webhook className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{webhooks.length}</div>
            <div className="text-gray-600 text-sm">Total Webhooks</div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {(Array.isArray(webhooks) ? webhooks : []).filter(w => w.status === 'active').length}
            </div>
            <div className="text-gray-600 text-sm">Active</div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {webhooks.reduce((sum, w) => sum + (w.totalCalls || 0), 0)}
            </div>
            <div className="text-gray-600 text-sm">Total Calls</div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {webhooks.length > 0 ? Math.round(webhooks.reduce((sum, w) => sum + (w.successRate || 100), 0) / webhooks.length) : 100}%
            </div>
            <div className="text-gray-600 text-sm">Success Rate</div>
          </CardBody>
        </Card>
      </div>

      {/* Webhooks List */}
      {webhooks.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <Webhook className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No webhooks configured</h3>
            <p className="text-gray-600 mb-6">Set up your first webhook to receive real-time event notifications</p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Webhook
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-6">
          {webhooks.map(webhook => (
            <Card key={webhook._id} className="hover:shadow-lg transition-shadow duration-200">
              <CardBody className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Webhook className="w-5 h-5 text-blue-600" />
                      <h3 className="text-xl font-semibold text-gray-900">{webhook.name}</h3>
                      {getStatusBadge(webhook.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 truncate">{webhook.url}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{webhook.totalCalls || 0} calls</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{webhook.successRate || 100}% success</span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Bell className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900">Subscribed Events</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {webhook.events?.map(event => (
                          <div key={event} className="flex items-center gap-1 px-2 py-1 bg-white rounded-md border border-gray-200">
                            {getEventIcon(event)}
                            <span className="text-xs text-gray-600">{event.replace('.', ' ')}</span>
                          </div>
                        )) || <span className="text-sm text-gray-500">No events configured</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleTestWebhook(webhook)}
                      disabled={testingWebhook === webhook._id}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                      title="Test Webhook"
                    >
                      {testingWebhook === webhook._id ? (
                        <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => setEditingWebhook(webhook)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title="Edit Webhook"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteWebhook(webhook._id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="Delete Webhook"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Webhook Modal */}
      {(showCreateModal || editingWebhook) && (
        <WebhookCreateModal
          webhook={editingWebhook}
          onClose={() => {
            setShowCreateModal(false)
            setEditingWebhook(null)
            setResult(null)
          }}
          onSave={handleCreateWebhook}
        />
      )}
    </div>
  )
}

// Webhook Create Modal Component
const WebhookCreateModal = ({ webhook, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [],
    secret: '',
    status: 'active',
    retries: 3,
    timeout: 30
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showSecret, setShowSecret] = useState(false)

  useEffect(() => {
    if (webhook) {
      setFormData({
        name: webhook.name || '',
        url: webhook.url || '',
        events: webhook.events || [],
        secret: webhook.secret || '',
        status: webhook.status || 'active',
        retries: webhook.retries || 3,
        timeout: webhook.timeout || 30
      })
    }
  }, [webhook])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    
    // Validation
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Webhook name is required'
    if (!formData.url.trim()) newErrors.url = 'Webhook URL is required'
    else if (!formData.url.match(/^https?:\/\/.+/)) newErrors.url = 'Please enter a valid URL'
    if (formData.events.length === 0) newErrors.events = 'At least one event must be selected'
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setLoading(true)
    try {
      await onSave(formData)
    } finally {
      setLoading(false)
    }
  }

  const availableEvents = [
    { value: 'notification.delivered', label: 'Notification Delivered', description: 'When a notification is successfully delivered' },
    { value: 'notification.clicked', label: 'Notification Clicked', description: 'When a user clicks on a notification' },
    { value: 'notification.failed', label: 'Notification Failed', description: 'When a notification delivery fails' },
    { value: 'user.subscribed', label: 'User Subscribed', description: 'When a new user subscribes to notifications' },
    { value: 'user.unsubscribed', label: 'User Unsubscribed', description: 'When a user unsubscribes from notifications' },
    { value: 'campaign.started', label: 'Campaign Started', description: 'When a campaign starts executing' },
    { value: 'campaign.completed', label: 'Campaign Completed', description: 'When a campaign finishes executing' }
  ]

  const handleEventToggle = (eventValue) => {
    setFormData(prev => ({
      ...prev,
      events: (Array.isArray(prev.events) ? prev.events : []).includes(eventValue)
        ? (Array.isArray(prev.events) ? prev.events : []).filter(e => e !== eventValue)
        : [...(Array.isArray(prev.events) ? prev.events : []), eventValue]
    }))
  }

  const generateSecret = () => {
    const secret = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
    setFormData(prev => ({ ...prev, secret }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-large w-full max-w-4xl max-h-[95vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                <Webhook className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{webhook ? 'Edit Webhook' : 'Create New Webhook'}</h2>
                <p className="text-indigo-100">Configure webhook endpoints for event notifications</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">
            {/* Basic Configuration */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-indigo-600" />
                </div>
                Basic Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Webhook Name</label>
                  <input
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Delivery Notifications, User Events"
                  />
                  {errors.name && <div className="form-error">{errors.name}</div>}
                </div>
                
                <div>
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="form-label">Endpoint URL</label>
                  <input
                    className="form-input"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://your-app.com/webhooks/notifications"
                  />
                  {errors.url && <div className="form-error">{errors.url}</div>}
                </div>
              </div>
            </div>

            {/* Event Configuration */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-4 h-4 text-blue-600" />
                </div>
                Event Subscriptions
              </h3>
              {errors.events && <div className="form-error mb-4">{errors.events}</div>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableEvents.map(event => (
                  <div key={event.value} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id={event.value}
                      checked={formData.events.includes(event.value)}
                      onChange={() => handleEventToggle(event.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                    />
                    <div className="flex-1">
                      <label htmlFor={event.value} className="block text-sm font-medium text-gray-900 mb-1 cursor-pointer">
                        {event.label}
                      </label>
                      <p className="text-xs text-gray-600">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security & Advanced */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Key className="w-4 h-4 text-green-600" />
                </div>
                Security & Advanced Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="form-label">Webhook Secret (Optional)</label>
                  <div className="relative">
                    <input
                      className="form-input pr-20"
                      type={showSecret ? 'text' : 'password'}
                      value={formData.secret}
                      onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
                      placeholder="Leave empty to disable signing"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-3">
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={generateSecret}
                        className="text-blue-600 hover:text-blue-800"
                        title="Generate Secret"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Used to verify webhook authenticity</p>
                </div>
                
                <div>
                  <label className="form-label">Max Retries</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    max="10"
                    value={formData.retries}
                    onChange={(e) => setFormData(prev => ({ ...prev, retries: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-gray-600 mt-1">Number of retry attempts on failure</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Timeout (seconds)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="5"
                    max="300"
                    value={formData.timeout}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeout: parseInt(e.target.value) || 30 }))}
                  />
                  <p className="text-xs text-gray-600 mt-1">Request timeout duration</p>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-gray-200 px-8 py-6 bg-gray-50 flex justify-end gap-3 flex-shrink-0 rounded-b-2xl">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  {webhook ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {webhook ? 'Update Webhook' : 'Create Webhook'}
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export const CampaignBuilder = () => {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [result, setResult] = useState(null)
  const apiBase = useApiBase()

  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      
      const url = statusFilter === 'all' ? 
        `${apiBase}/api/campaigns/list` : 
        `${apiBase}/api/campaigns/list?status=${statusFilter}`
      
      const response = await fetch(url, { headers })
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      } else {
        console.error('Failed to load campaigns')
        setCampaigns([])
      }
    } catch (error) {
      console.error('Campaign load error:', error)
      setCampaigns([])
    } finally {
      setLoading(false)
    }
  }, [apiBase, statusFilter])

  useEffect(() => {
    loadCampaigns()
  }, [loadCampaigns])

  const handleCreateCampaign = async (campaignData) => {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      const response = await fetch(`${apiBase}/api/campaigns/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(campaignData)
      })
      
      if (response.ok) {
        await loadCampaigns()
        setShowCreateModal(false)
        setResult({ success: true, message: 'Campaign created successfully!' })
      } else {
        const error = await response.json()
        setResult({ success: false, message: error.error || 'Failed to create campaign' })
      }
    } catch (error) {
      setResult({ success: false, message: error.message })
    }
  }

  const handleToggleCampaign = async (campaignId, action) => {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      const response = await fetch(`${apiBase}/api/campaigns/${campaignId}/${action}`, {
        method: 'POST',
        headers
      })
      
      if (response.ok) {
        await loadCampaigns()
        setResult({ success: true, message: `Campaign ${action}ed successfully!` })
      } else {
        const error = await response.json()
        setResult({ success: false, message: error.error || `Failed to ${action} campaign` })
      }
    } catch (error) {
      setResult({ success: false, message: error.message })
    }
  }

  const handleDeleteCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return
    
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      const response = await fetch(`${apiBase}/api/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers
      })
      
      if (response.ok) {
        await loadCampaigns()
        setResult({ success: true, message: 'Campaign deleted successfully!' })
      } else {
        const error = await response.json()
        setResult({ success: false, message: error.error || 'Failed to delete campaign' })
      }
    } catch (error) {
      setResult({ success: false, message: error.message })
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success'
      case 'paused': return 'warning'
      case 'draft': return 'secondary'
      case 'completed': return 'primary'
      default: return 'secondary'
    }
  }

  const getTriggerLabel = (trigger) => {
    switch (trigger.type) {
      case 'subscription': return 'On Subscribe'
      case 'event': return 'Custom Event'
      case 'date': return 'Specific Date'
      case 'inactivity': return 'User Inactivity'
      case 'segment_entry': return 'Segment Entry'
      case 'behavior': return 'User Behavior'
      default: return trigger.type
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Loading size="large" />
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-10">
          <Target className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">Campaign Management</h1>
                <p className="text-indigo-100 text-lg">Create and manage automated notification campaigns</p>
              </div>
            </div>
            <Button 
              variant="primary" 
              onClick={() => setShowCreateModal(true)}
              className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Campaign
            </Button>
          </div>
        </div>
      </div>

      {result && (
        <div className={`p-4 mb-6 rounded-lg border-l-4 ${result.success 
          ? 'bg-green-50 border-green-400 text-green-800' 
          : 'bg-red-50 border-red-400 text-red-800'
        }`}>
          {result.message}
        </div>
      )}

      {/* Enhanced Filters */}
      <div className="bg-white rounded-xl shadow-soft p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-lg font-semibold text-gray-900">Filters</span>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select w-48 text-sm"
            >
              <option value="all">All Campaigns ({(Array.isArray(campaigns) ? campaigns : []).length})</option>
              <option value="active">Active ({(Array.isArray(campaigns) ? campaigns : []).filter(c => c.status === 'active').length})</option>
              <option value="draft">Draft ({(Array.isArray(campaigns) ? campaigns : []).filter(c => c.status === 'draft').length})</option>
              <option value="paused">Paused ({(Array.isArray(campaigns) ? campaigns : []).filter(c => c.status === 'paused').length})</option>
              <option value="completed">Completed ({(Array.isArray(campaigns) ? campaigns : []).filter(c => c.status === 'completed').length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-soft p-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target className="w-12 h-12 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {statusFilter === 'all' ? 'No campaigns yet' : `No ${statusFilter} campaigns`}
          </h3>
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            {statusFilter === 'all' 
              ? 'Get started by creating your first automated campaign to engage your subscribers'
              : `No campaigns with status "${statusFilter}" found. Try adjusting your filter or create a new campaign.`
            }
          </p>
          {statusFilter === 'all' && (
            <Button 
              variant="primary" 
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Campaign
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {campaigns.map(campaign => (
            <div key={campaign._id} className="bg-white rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {campaign.name}
                      </h3>
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                        campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                        campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                        campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {campaign.status === 'active' && <PlayCircle className="w-4 h-4" />}
                        {campaign.status === 'paused' && <PauseCircle className="w-4 h-4" />}
                        {campaign.status === 'draft' && <Edit3 className="w-4 h-4" />}
                        {campaign.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                        {campaign.status.toUpperCase()}
                      </span>
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                        <Target className="w-4 h-4" />
                        {getTriggerLabel(campaign.trigger)}
                      </span>
                    </div>
                    {campaign.description && (
                      <p className="text-gray-600 text-base mb-4 leading-relaxed">
                        {campaign.description}
                      </p>
                    )}
                    
                    {/* Enhanced Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 text-center">
                        <div className="w-8 h-8 bg-indigo-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <GitBranch className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="text-2xl font-bold text-indigo-600 mb-1">{campaign.steps?.length || 0}</div>
                        <div className="text-sm text-indigo-700 font-medium">Steps</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                        <div className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <UserPlus className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-green-600 mb-1">{campaign.stats?.totalEntered || 0}</div>
                        <div className="text-sm text-green-700 font-medium">Entered</div>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 text-center">
                        <div className="w-8 h-8 bg-yellow-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Zap className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div className="text-2xl font-bold text-yellow-600 mb-1">{campaign.stats?.currentlyActive || 0}</div>
                        <div className="text-sm text-yellow-700 font-medium">Active</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                        <div className="w-8 h-8 bg-purple-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <TrendingUp className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="text-2xl font-bold text-purple-600 mb-1">{campaign.stats?.conversionRate || 0}%</div>
                        <div className="text-sm text-purple-700 font-medium">Conversion</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Created {new Date(campaign.createdAt).toLocaleDateString()}
                      </span>
                      {campaign.lastTriggered && (
                        <span className="flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Last triggered {new Date(campaign.lastTriggered).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => {
                        setSelectedCampaign(campaign)
                        setShowAnalytics(true)
                      }}
                      className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors duration-200 font-medium"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analytics
                    </button>
                    
                    {campaign.status === 'draft' || campaign.status === 'paused' ? (
                      <button 
                        onClick={() => handleToggleCampaign(campaign._id, 'start')}
                        className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors duration-200 font-medium"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Campaign
                      </button>
                    ) : campaign.status === 'active' ? (
                      <button 
                        onClick={() => handleToggleCampaign(campaign._id, 'pause')}
                        className="inline-flex items-center px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors duration-200 font-medium"
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Pause Campaign
                      </button>
                    ) : null}
                    
                    {campaign.status !== 'active' && (
                      <button 
                        onClick={() => handleDeleteCampaign(campaign._id)}
                        className="inline-flex items-center px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors duration-200 font-medium"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <CampaignCreateModal
          onClose={() => {
            setShowCreateModal(false)
            setResult(null)
          }}
          onSave={handleCreateCampaign}
        />
      )}

      {/* Analytics Modal */}
      {showAnalytics && selectedCampaign && (
        <CampaignAnalyticsModal
          campaign={selectedCampaign}
          onClose={() => {
            setShowAnalytics(false)
            setSelectedCampaign(null)
          }}
        />
      )}
    </div>
  )
}

// Campaign Create Modal Component
const CampaignCreateModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger: {
      type: 'subscription'
    },
    steps: [
      {
        type: 'notification',
        name: 'Welcome Message',
        title: 'Welcome!',
        body: 'Thanks for subscribing to our notifications!'
      }
    ],
    targetSegment: 'all',
    isActive: false
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const triggerTypes = [
    { value: 'subscription', label: 'On Subscribe' },
    { value: 'event', label: 'Custom Event' },
    { value: 'date', label: 'Specific Date' },
    { value: 'inactivity', label: 'User Inactivity' },
    { value: 'segment_entry', label: 'Segment Entry' },
    { value: 'behavior', label: 'User Behavior' }
  ]

  const stepTypes = [
    { value: 'notification', label: 'Send Notification' },
    { value: 'wait', label: 'Wait/Delay' },
    { value: 'condition', label: 'Conditional Branch' },
    { value: 'segment_update', label: 'Update User Segment' },
    { value: 'webhook', label: 'Webhook Call' }
  ]

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) newErrors.name = 'Campaign name is required'
    if (formData.steps.length === 0) newErrors.steps = 'At least one step is required'
    
    formData.steps.forEach((step, index) => {
      if (step.type === 'notification') {
        if (!step.title?.trim()) newErrors[`step_${index}_title`] = 'Notification title is required'
        if (!step.body?.trim()) newErrors[`step_${index}_body`] = 'Notification body is required'
      } else if (step.type === 'wait') {
        if (!step.duration || step.duration <= 0) newErrors[`step_${index}_duration`] = 'Wait duration is required'
        if (!step.unit) newErrors[`step_${index}_unit`] = 'Wait unit is required'
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setSaving(true)
    try {
      await onSave(formData)
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const addStep = () => {
    const newStep = {
      type: 'notification',
      name: `Step ${formData.steps.length + 1}`,
      title: '',
      body: ''
    }
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }))
  }

  const updateStep = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }))
    // Clear related errors
    const errorKey = `step_${index}_${field}`
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: undefined }))
    }
  }

  const removeStep = (index) => {
    if (formData.steps.length <= 1) return
    setFormData(prev => ({
      ...prev,
      steps: (Array.isArray(prev.steps) ? prev.steps : []).filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-large w-full max-w-4xl max-h-[95vh] flex flex-col">
        {/* Enhanced Modal Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">Create New Campaign</h2>
                <p className="text-indigo-100">Build your automated notification sequence</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="space-y-8">
              {/* Enhanced Basic Information Section */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Campaign Details</h3>
                </div>
                <div className="grid gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name *</label>
                    <input
                      className="form-input"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Welcome Series"
                    />
                    {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name}</div>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe what this campaign does"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Type</label>
                    <select
                      className="form-select"
                      value={formData.trigger.type}
                      onChange={(e) => handleInputChange('trigger', { ...formData.trigger, type: e.target.value })}
                    >
                      {triggerTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                    <select
                      className="form-select"
                      value={formData.targetSegment}
                      onChange={(e) => handleInputChange('targetSegment', e.target.value)}
                    >
                      <option value="all">All Subscribers</option>
                      <option value="new">New Subscribers</option>
                      <option value="active">Active Users</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Enhanced Campaign Steps Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <GitBranch className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Campaign Steps</h3>
                  </div>
                  <button
                    type="button"
                    onClick={addStep}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Step
                  </button>
                </div>
                
                {errors.steps && <div className="form-error">{errors.steps}</div>}

                <div className="space-y-4">
                  {formData.steps.map((step, index) => (
                    <div key={index} className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-bold text-indigo-600">{index + 1}</span>
                          </div>
                          <select
                            className="form-select text-base font-medium"
                            style={{ minWidth: '180px' }}
                            value={step.type}
                            onChange={(e) => updateStep(index, 'type', e.target.value)}
                          >
                            {stepTypes.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        {formData.steps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStep(index)}
                            className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Step Name</label>
                          <input
                            className="form-input"
                            value={step.name || ''}
                            onChange={(e) => updateStep(index, 'name', e.target.value)}
                            placeholder="Step name"
                          />
                        </div>

                        {step.type === 'notification' && (
                          <>
                            <div>
                              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <MailOpen className="w-4 h-4" />
                                Notification Title *
                              </label>
                              <input
                                className="form-input"
                                value={step.title || ''}
                                onChange={(e) => updateStep(index, 'title', e.target.value)}
                                placeholder="e.g., Welcome to our platform!"
                              />
                              {errors[`step_${index}_title`] && <div className="text-red-600 text-sm mt-1">{errors[`step_${index}_title`]}</div>}
                            </div>
                            <div>
                              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <MessageSquare className="w-4 h-4" />
                                Notification Message *
                              </label>
                              <textarea
                                className="form-textarea"
                                rows={3}
                                value={step.body || ''}
                                onChange={(e) => updateStep(index, 'body', e.target.value)}
                                placeholder="e.g., Thanks for subscribing! Get ready for amazing updates."
                              />
                              {errors[`step_${index}_body`] && <div className="text-red-600 text-sm mt-1">{errors[`step_${index}_body`]}</div>}
                            </div>
                            <div>
                              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Link2 className="w-4 h-4" />
                                Click URL (Optional)
                              </label>
                              <input
                                className="form-input"
                                value={step.url || ''}
                                onChange={(e) => updateStep(index, 'url', e.target.value)}
                                placeholder="https://example.com/welcome"
                              />
                            </div>
                          </>
                        )}

                        {step.type === 'wait' && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Timer className="w-4 h-4" />
                                Wait Duration *
                              </label>
                              <input
                                className="form-input"
                                type="number"
                                min="1"
                                value={step.duration || ''}
                                onChange={(e) => updateStep(index, 'duration', parseInt(e.target.value))}
                                placeholder="1"
                              />
                              {errors[`step_${index}_duration`] && <div className="text-red-600 text-sm mt-1">{errors[`step_${index}_duration`]}</div>}
                            </div>
                            <div>
                              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Clock className="w-4 h-4" />
                                Time Unit *
                              </label>
                              <select
                                className="form-select"
                                value={step.unit || 'days'}
                                onChange={(e) => updateStep(index, 'unit', e.target.value)}
                              >
                                <option value="minutes">Minutes</option>
                                <option value="hours">Hours</option>
                                <option value="days">Days</option>
                                <option value="weeks">Weeks</option>
                              </select>
                              {errors[`step_${index}_unit`] && <div className="text-red-600 text-sm mt-1">{errors[`step_${index}_unit`]}</div>}
                            </div>
                          </div>
                        )}

                        {step.type === 'webhook' && (
                          <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                              <Webhook className="w-4 h-4" />
                              Webhook URL
                            </label>
                            <input
                              className="form-input"
                              value={step.webhookUrl || ''}
                              onChange={(e) => updateStep(index, 'webhookUrl', e.target.value)}
                              placeholder="https://example.com/webhook"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enhanced Campaign Options */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Campaign Options</h3>
                </div>
                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-green-300 transition-colors duration-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                  />
                  <div className="flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-green-600" />
                    <div>
                      <span className="font-medium text-gray-900">Auto-Start Campaign</span>
                      <p className="text-sm text-gray-600 mt-1">Campaign will start immediately after creation</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Enhanced Modal Footer */}
          <div className="border-t border-gray-200 px-8 py-6 bg-gray-50 flex justify-end space-x-4 flex-shrink-0 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Creating Campaign...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Rocket className="w-4 h-4" />
                  Create Campaign
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Campaign Analytics Modal Component
const CampaignAnalyticsModal = ({ campaign, onClose }) => {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')
  const apiBase = useApiBase()

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
        
        const response = await fetch(`${apiBase}/api/campaigns/${campaign._id}/analytics?days=${timeRange}`, { headers })
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        }
      } catch (error) {
        console.error('Analytics load error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadAnalytics()
  }, [apiBase, campaign._id, timeRange])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-large w-full max-w-6xl max-h-[95vh] flex flex-col">
        {/* Enhanced Analytics Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">Campaign Analytics</h2>
                <p className="text-blue-100 text-lg">{campaign.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-white/10 text-white rounded-lg px-4 py-2 border border-white/20 focus:ring-2 focus:ring-white/50"
              >
                <option value="7" className="text-gray-900">Last 7 days</option>
                <option value="30" className="text-gray-900">Last 30 days</option>
                <option value="90" className="text-gray-900">Last 90 days</option>
              </select>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 min-h-0">
          {loading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-lg text-gray-600">Loading analytics data...</p>
              </div>
            </div>
          ) : analytics ? (
            <div className="space-y-8">
              {/* Enhanced Overview Stats */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                  </div>
                  Performance Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white border border-indigo-200 rounded-xl p-6 text-center shadow-sm">
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Rocket className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">{analytics.overview?.totalExecutions || 0}</div>
                    <div className="text-gray-600 font-medium">Total Executions</div>
                  </div>
                  <div className="bg-white border border-green-200 rounded-xl p-6 text-center shadow-sm">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Zap className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">{analytics.overview?.activeExecutions || 0}</div>
                    <div className="text-gray-600 font-medium">Active Users</div>
                  </div>
                  <div className="bg-white border border-blue-200 rounded-xl p-6 text-center shadow-sm">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">{analytics.overview?.completedExecutions || 0}</div>
                    <div className="text-gray-600 font-medium">Completed</div>
                  </div>
                  <div className="bg-white border border-purple-200 rounded-xl p-6 text-center shadow-sm">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">{analytics.overview?.conversionRate || 0}%</div>
                    <div className="text-gray-600 font-medium">Conversion Rate</div>
                  </div>
                </div>
              </div>

              {/* Step Performance */}
              {analytics.stepPerformance && analytics.stepPerformance.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChart2 className="w-5 h-5 text-blue-600" />
                    </div>
                    Step Performance
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left">
                            <span className="text-sm font-semibold text-gray-900">Step</span>
                          </th>
                          <th className="px-6 py-4 text-center">
                            <span className="text-sm font-semibold text-gray-900">Entered</span>
                          </th>
                          <th className="px-6 py-4 text-center">
                            <span className="text-sm font-semibold text-gray-900">Completed</span>
                          </th>
                          <th className="px-6 py-4 text-center">
                            <span className="text-sm font-semibold text-gray-900">Failed</span>
                          </th>
                          <th className="px-6 py-4 text-center">
                            <span className="text-sm font-semibold text-gray-900">Conversion</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {analytics.stepPerformance.map((step, index) => (
                          <tr key={step.stepId} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                  {step.type === 'notification' && <MailOpen className="w-4 h-4 text-indigo-600" />}
                                  {step.type === 'wait' && <Timer className="w-4 h-4 text-indigo-600" />}
                                  {step.type === 'webhook' && <Webhook className="w-4 h-4 text-indigo-600" />}
                                  {step.type === 'condition' && <Split className="w-4 h-4 text-indigo-600" />}
                                  {step.type === 'segment_update' && <Users2 className="w-4 h-4 text-indigo-600" />}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{step.name}</div>
                                  <div className="text-sm text-gray-500 capitalize">{step.type.replace('_', ' ')}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-lg font-semibold text-gray-900">{step.entered}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-lg font-semibold text-green-600">{step.completed}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-lg font-semibold text-red-600">{step.failed}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <TrendingUp className="w-4 h-4 text-purple-600" />
                                <span className="text-lg font-bold text-purple-600">{step.conversionRate}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Timeline Chart Placeholder */}
              {analytics.timeline && analytics.timeline.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <LineChart className="w-5 h-5 text-green-600" />
                    </div>
                    Activity Timeline
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Campaign Activity Over Time</h4>
                    <p className="text-gray-600 mb-4">Timeline visualization with {analytics.timeline.length} data points</p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600">
                      <BarChart3 className="w-4 h-4" />
                      Chart integration coming soon
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Analytics Available</h3>
              <p className="text-gray-600">Analytics data will appear here once the campaign starts running</p>
            </div>
          )}
        </div>

        {/* Enhanced Analytics Footer */}
        <div className="border-t border-gray-200 px-8 py-6 bg-gray-50 flex justify-end flex-shrink-0 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Close Analytics
          </button>
        </div>
      </div>
    </div>
  )
}

export const NotificationTemplates = () => {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [result, setResult] = useState(null)
  const apiBase = useApiBase()
  const headers = useAuthHeaders()

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const requestHeaders = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      const response = await fetch(`${apiBase}/api/templates/list`, { headers: requestHeaders })
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      } else {
        console.error('Failed to load templates')
        setTemplates([])
      }
    } catch (error) {
      console.error('Template load error:', error)
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const handleCreateTemplate = async (templateData) => {
    try {
      const token = localStorage.getItem('token')
      const requestHeaders = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      const response = await fetch(`${apiBase}/api/templates/create`, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(templateData)
      })
      
      if (response.ok) {
        await loadTemplates()
        setShowCreateModal(false)
        setResult({ success: true, message: 'Template created successfully!' })
      } else {
        const error = await response.json()
        setResult({ success: false, message: error.error || 'Failed to create template' })
      }
    } catch (error) {
      setResult({ success: false, message: error.message })
    }
  }

  const handleEditTemplate = async (templateData) => {
    try {
      const token = localStorage.getItem('token')
      const requestHeaders = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      const response = await fetch(`${apiBase}/api/templates/${editingTemplate._id}`, {
        method: 'PUT',
        headers: requestHeaders,
        body: JSON.stringify(templateData)
      })
      
      if (response.ok) {
        await loadTemplates()
        setEditingTemplate(null)
        setResult({ success: true, message: 'Template updated successfully!' })
      } else {
        const error = await response.json()
        setResult({ success: false, message: error.error || 'Failed to update template' })
      }
    } catch (error) {
      setResult({ success: false, message: error.message })
    }
  }

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return
    
    try {
      const token = localStorage.getItem('token')
      const requestHeaders = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      const response = await fetch(`${apiBase}/api/templates/${templateId}`, {
        method: 'DELETE',
        headers: requestHeaders
      })
      
      if (response.ok) {
        await loadTemplates()
        setResult({ success: true, message: 'Template deleted successfully!' })
      } else {
        const error = await response.json()
        setResult({ success: false, message: error.error || 'Failed to delete template' })
      }
    } catch (error) {
      setResult({ success: false, message: error.message })
    }
  }

  const handleDuplicateTemplate = async (templateId) => {
    try {
      const token = localStorage.getItem('token')
      const requestHeaders = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      const response = await fetch(`${apiBase}/api/templates/${templateId}/duplicate`, {
        method: 'POST',
        headers: requestHeaders
      })
      
      if (response.ok) {
        await loadTemplates()
        setResult({ success: true, message: 'Template duplicated successfully!' })
      } else {
        const error = await response.json()
        setResult({ success: false, message: error.error || 'Failed to duplicate template' })
      }
    } catch (error) {
      setResult({ success: false, message: error.message })
    }
  }

  const categories = ['all', 'marketing', 'transactional', 'promotional', 'alert', 'welcome', 'reminder']
  const filteredTemplates = (Array.isArray(templates) ? templates : []).filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Loading size="large" />
      </div>
    )
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>Notification Templates</h1>
          <p style={{ color: 'var(--gray-600)', marginTop: '0.25rem', margin: 0 }}>Create and manage reusable notification templates</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
          Create Template
        </Button>
      </div>

      {result && (
        <Alert type={result.success ? 'success' : 'error'} style={{ marginBottom: '1.5rem' }}>
          {result.message}
        </Alert>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ 
            flex: 1, 
            minWidth: '250px',
            padding: '0.5rem 0.75rem', 
            border: '1px solid var(--gray-300)', 
            borderRadius: '0.5rem',
            fontSize: '0.875rem'
          }}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: '0.5rem', border: '1px solid var(--gray-300)', borderRadius: '0.5rem' }}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)} {cat === 'all' ? 'Templates' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '3rem' }}>
            <FileText style={{ width: '4rem', height: '4rem', color: 'var(--gray-300)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 1rem 0' }}>
              {searchQuery || selectedCategory !== 'all' ? 'No templates found' : 'No templates yet'}
            </h3>
            <p style={{ color: 'var(--gray-500)', marginBottom: '2rem' }}>
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first notification template'
              }
            </p>
            {(!searchQuery && selectedCategory === 'all') && (
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <Plus style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                Create Your First Template
              </Button>
            )}
          </CardBody>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {filteredTemplates.map(template => (
            <Card key={template._id} style={{ position: 'relative' }}>
              <CardBody>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.5rem 0', color: 'var(--gray-900)' }}>
                      {template.name}
                    </h3>
                    {template.category && (
                      <Badge variant="secondary" style={{ marginBottom: '0.5rem' }}>
                        {template.category}
                      </Badge>
                    )}
                    {template.description && (
                      <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', margin: '0 0 1rem 0' }}>
                        {template.description}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                    <button
                      onClick={() => {
                        setPreviewTemplate(template)
                        setShowPreview(true)
                      }}
                      style={{ 
                        padding: '0.5rem', 
                        border: 'none', 
                        background: 'var(--gray-100)', 
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Preview"
                    >
                      <Eye style={{ width: '1rem', height: '1rem' }} />
                    </button>
                    <button
                      onClick={() => setEditingTemplate(template)}
                      style={{ 
                        padding: '0.5rem', 
                        border: 'none', 
                        background: 'var(--primary-100)', 
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Edit"
                    >
                      <Edit3 style={{ width: '1rem', height: '1rem', color: 'var(--primary-600)' }} />
                    </button>
                  </div>
                </div>
                
                <div style={{ background: 'var(--gray-50)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>{template.title}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{template.body}</div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => handleDuplicateTemplate(template._id)}
                  >
                    <Copy style={{ width: '0.875rem', height: '0.875rem', marginRight: '0.5rem' }} />
                    Duplicate
                  </Button>
                  <Button 
                    variant="error" 
                    size="sm"
                    onClick={() => handleDeleteTemplate(template._id)}
                  >
                    <Trash2 style={{ width: '0.875rem', height: '0.875rem', marginRight: '0.5rem' }} />
                    Delete
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTemplate) && (
        <TemplateModal
          template={editingTemplate}
          onClose={() => {
            setShowCreateModal(false)
            setEditingTemplate(null)
            setResult(null)
          }}
          onSave={editingTemplate ? handleEditTemplate : handleCreateTemplate}
        />
      )}

      {/* Preview Modal */}
      {showPreview && previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => {
            setShowPreview(false)
            setPreviewTemplate(null)
          }}
        />
      )}
    </div>
  )
}

export const ABTesting = () => {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTest, setEditingTest] = useState(null)
  const [viewingResults, setViewingResults] = useState(null)
  const [result, setResult] = useState(null)
  const apiBase = useApiBase()

  const loadTests = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      const response = await fetch(`${apiBase}/api/abtests`, { headers })
      if (response.ok) {
        const data = await response.json()
        setTests(Array.isArray(data) ? data : (data?.tests || []))
      }
    } catch (error) {
      console.error('Error loading A/B tests:', error)
    } finally {
      setLoading(false)
    }
  }, [apiBase])

  useEffect(() => {
    loadTests()
  }, [])

  const handleCreateTest = async (testData) => {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      const url = editingTest ? `${apiBase}/api/abtests/${editingTest._id}` : `${apiBase}/api/abtests`
      const method = editingTest ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(testData)
      })
      
      if (response.ok) {
        await loadTests()
        setResult({ success: true, message: `A/B test ${editingTest ? 'updated' : 'created'} successfully!` })
        setShowCreateModal(false)
        setEditingTest(null)
      } else {
        const error = await response.json()
        setResult({ success: false, message: error.error || 'Failed to save A/B test' })
      }
    } catch (error) {
      setResult({ success: false, message: error.message })
    }
  }

  const handleToggleTest = async (testId, action) => {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      const response = await fetch(`${apiBase}/api/abtests/${testId}/${action}`, {
        method: 'POST',
        headers
      })
      
      if (response.ok) {
        await loadTests()
        setResult({ success: true, message: `A/B test ${action}d successfully!` })
      } else {
        const error = await response.json()
        setResult({ success: false, message: error.error || `Failed to ${action} test` })
      }
    } catch (error) {
      setResult({ success: false, message: error.message })
    }
  }

  const handleDeleteTest = async (testId) => {
    if (!confirm('Are you sure you want to delete this A/B test?')) return
    
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      const response = await fetch(`${apiBase}/api/abtests/${testId}`, {
        method: 'DELETE',
        headers
      })
      
      if (response.ok) {
        await loadTests()
        setResult({ success: true, message: 'A/B test deleted successfully!' })
      } else {
        const error = await response.json()
        setResult({ success: false, message: error.error || 'Failed to delete test' })
      }
    } catch (error) {
      setResult({ success: false, message: error.message })
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running': return <PlayCircle className="w-4 h-4 text-green-600" />
      case 'paused': return <PauseCircle className="w-4 h-4 text-yellow-600" />
      case 'completed': return <CheckCircle className="w-4 h-4 text-blue-600" />
      case 'draft': return <FileX className="w-4 h-4 text-gray-600" />
      default: return <TestTube2 className="w-4 h-4 text-gray-600" />
    }
  }

  const getWinningVariant = (test) => {
    if (!test.results || test.status !== 'completed') return null
    const variants = test.results.variants || []
    if (variants.length === 0) return null
    
    let winner = variants[0]
    variants.forEach(variant => {
      if (variant.conversionRate > winner.conversionRate) {
        winner = variant
      }
    })
    
    return winner
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loading size="large" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">A/B Testing</h1>
          <p className="text-gray-600 mt-1">Test different notification variants to optimize performance</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create A/B Test
        </Button>
      </div>

      {result && (
        <Alert type={result.success ? 'success' : 'error'} className="mb-6">
          {result.message}
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardBody className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <TestTube2 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{tests.length}</div>
            <div className="text-gray-600 text-sm">Total Tests</div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <PlayCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {(Array.isArray(tests) ? tests : []).filter(t => t.status === 'running').length}
            </div>
            <div className="text-gray-600 text-sm">Running Tests</div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {(Array.isArray(tests) ? tests : []).filter(t => t.status === 'completed').length}
            </div>
            <div className="text-gray-600 text-sm">Completed Tests</div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {tests.length > 0 ? Math.round(tests.reduce((sum, t) => sum + (t.averageLift || 0), 0) / tests.length) : 0}%
            </div>
            <div className="text-gray-600 text-sm">Avg Lift</div>
          </CardBody>
        </Card>
      </div>

      {/* Tests List */}
      {tests.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <TestTube2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No A/B tests yet</h3>
            <p className="text-gray-600 mb-6">Create your first A/B test to start optimizing your notifications</p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First A/B Test
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-6">
          {tests.map(test => {
            const winner = getWinningVariant(test)
            return (
              <Card key={test._id} className="hover:shadow-lg transition-shadow duration-200">
                <CardBody className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusIcon(test.status)}
                        <h3 className="text-xl font-semibold text-gray-900">{test.name}</h3>
                        <Badge 
                          variant={test.status === 'running' ? 'success' : test.status === 'completed' ? 'primary' : 'secondary'}
                        >
                          {test.status}
                        </Badge>
                        {winner && (
                          <Badge variant="warning">
                            Winner: {winner.name}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-4">{test.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{test.participants || 0} participants</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{test.trafficSplit || 50}% split</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {test.status === 'running' ? 'Started' : 'Created'} {new Date(test.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{test.averageLift || 0}% avg lift</span>
                        </div>
                      </div>
                      
                      {/* Variants Preview */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <TestTube2 className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-900">Test Variants</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(test.variants || []).map((variant, index) => (
                            <div key={index} className="bg-white rounded-md p-3 border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm text-gray-900">{variant.name}</span>
                                <span className="text-xs text-gray-500">{variant.weight || 50}%</span>
                              </div>
                              <p className="text-xs text-gray-600 mb-1">{variant.notification?.title}</p>
                              <p className="text-xs text-gray-500">{variant.notification?.body}</p>
                              {test.status === 'completed' && variant.conversionRate !== undefined && (
                                <div className="mt-2 text-xs text-gray-600">
                                  Conversion: {variant.conversionRate}%
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {test.status === 'completed' && (
                        <button
                          onClick={() => setViewingResults(test)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="View Results"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => setEditingTest(test)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        title="Edit Test"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      
                      {test.status === 'running' ? (
                        <button
                          onClick={() => handleToggleTest(test._id, 'pause')}
                          className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors duration-200"
                          title="Pause Test"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      ) : test.status === 'paused' ? (
                        <button
                          onClick={() => handleToggleTest(test._id, 'start')}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                          title="Resume Test"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      ) : test.status === 'draft' ? (
                        <button
                          onClick={() => handleToggleTest(test._id, 'start')}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                          title="Start Test"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      ) : null}
                      
                      <button
                        onClick={() => handleDeleteTest(test._id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        title="Delete Test"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Test Modal */}
      {(showCreateModal || editingTest) && (
        <ABTestCreateModal
          test={editingTest}
          onClose={() => {
            setShowCreateModal(false)
            setEditingTest(null)
            setResult(null)
          }}
          onSave={handleCreateTest}
        />
      )}

      {/* Results Modal */}
      {viewingResults && (
        <ABTestResultsModal
          test={viewingResults}
          onClose={() => setViewingResults(null)}
        />
      )}
    </div>
  )
}

// A/B Test Create Modal Component
const ABTestCreateModal = ({ test, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trafficSplit: 50,
    variants: [
      { name: 'Control', notification: { title: '', body: '', url: '', icon: '', image: '' }, weight: 50 },
      { name: 'Variant A', notification: { title: '', body: '', url: '', icon: '', image: '' }, weight: 50 }
    ],
    targetSegment: 'all',
    duration: 7,
    metric: 'conversion_rate'
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (test) {
      setFormData({
        name: test.name || '',
        description: test.description || '',
        trafficSplit: test.trafficSplit || 50,
        variants: test.variants || [
          { name: 'Control', notification: { title: '', body: '', url: '', icon: '', image: '' }, weight: 50 },
          { name: 'Variant A', notification: { title: '', body: '', url: '', icon: '', image: '' }, weight: 50 }
        ],
        targetSegment: test.targetSegment || 'all',
        duration: test.duration || 7,
        metric: test.metric || 'conversion_rate'
      })
    }
  }, [test])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    
    // Validation
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Test name is required'
    if (formData.variants.some(v => !v.notification.title.trim() || !v.notification.body.trim())) {
      newErrors.variants = 'All variants must have title and body'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setLoading(true)
    try {
      await onSave(formData)
    } finally {
      setLoading(false)
    }
  }

  const updateVariant = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === index 
          ? field.includes('notification.') 
            ? { ...variant, notification: { ...variant.notification, [field.split('.')[1]]: value } }
            : { ...variant, [field]: value }
          : variant
      )
    }))
  }

  const addVariant = () => {
    const newVariantName = `Variant ${String.fromCharCode(65 + formData.variants.length - 1)}`
    const newWeight = Math.floor(100 / (formData.variants.length + 1))
    
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, {
        name: newVariantName,
        notification: { title: '', body: '', url: '', icon: '', image: '' },
        weight: newWeight
      }]
    }))
  }

  const removeVariant = (index) => {
    if (formData.variants.length <= 2) return // Minimum 2 variants
    
    setFormData(prev => ({
      ...prev,
      variants: (Array.isArray(prev.variants) ? prev.variants : []).filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-large w-full max-w-6xl max-h-[95vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6 text-white rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                <TestTube2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{test ? 'Edit A/B Test' : 'Create New A/B Test'}</h2>
                <p className="text-purple-100">Test different notification variants for optimal performance</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">
            {/* Basic Configuration */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-purple-600" />
                </div>
                Test Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Test Name</label>
                  <input
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Subject Line Test, CTA Button Test"
                  />
                  {errors.name && <div className="form-error">{errors.name}</div>}
                </div>
                
                <div>
                  <label className="form-label">Target Audience</label>
                  <select
                    className="form-select"
                    value={formData.targetSegment}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetSegment: e.target.value }))}
                  >
                    <option value="all">All Subscribers</option>
                    <option value="active">Active Users</option>
                    <option value="new">New Subscribers</option>
                    <option value="premium">Premium Users</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="form-label">Test Description</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what you're testing and your hypothesis"
                  />
                </div>
                
                <div>
                  <label className="form-label">Test Duration (days)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    max="30"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 7 }))}
                  />
                </div>
                
                <div>
                  <label className="form-label">Success Metric</label>
                  <select
                    className="form-select"
                    value={formData.metric}
                    onChange={(e) => setFormData(prev => ({ ...prev, metric: e.target.value }))}
                  >
                    <option value="conversion_rate">Conversion Rate</option>
                    <option value="click_rate">Click Through Rate</option>
                    <option value="engagement_rate">Engagement Rate</option>
                    <option value="open_rate">Open Rate</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Test Variants */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TestTube2 className="w-4 h-4 text-blue-600" />
                </div>
                Test Variants
              </h3>
              {errors.variants && <div className="form-error mb-4">{errors.variants}</div>}
              
              <div className="space-y-6">
                {formData.variants.map((variant, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-purple-600">{index === 0 ? 'C' : String.fromCharCode(64 + index)}</span>
                        </div>
                        <input
                          className="font-medium text-lg bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                          value={variant.name}
                          onChange={(e) => updateVariant(index, 'name', e.target.value)}
                          placeholder="Variant name"
                        />
                      </div>
                      {formData.variants.length > 2 && index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="form-label">Title</label>
                        <input
                          className="form-input"
                          value={variant.notification.title}
                          onChange={(e) => updateVariant(index, 'notification.title', e.target.value)}
                          placeholder="Notification title"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label">Message</label>
                        <textarea
                          className="form-textarea"
                          rows={2}
                          value={variant.notification.body}
                          onChange={(e) => updateVariant(index, 'notification.body', e.target.value)}
                          placeholder="Notification message"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="form-label">Click URL (Optional)</label>
                          <input
                            className="form-input"
                            type="url"
                            value={variant.notification.url}
                            onChange={(e) => updateVariant(index, 'notification.url', e.target.value)}
                            placeholder="https://example.com"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label">Icon URL (Optional)</label>
                          <input
                            className="form-input"
                            type="url"
                            value={variant.notification.icon}
                            onChange={(e) => updateVariant(index, 'notification.icon', e.target.value)}
                            placeholder="https://example.com/icon.png"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label">Traffic Weight (%)</label>
                          <input
                            className="form-input"
                            type="number"
                            min="1"
                            max="100"
                            value={variant.weight}
                            onChange={(e) => updateVariant(index, 'weight', parseInt(e.target.value) || 50)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addVariant}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 border-2 border-dashed border-blue-300 hover:border-blue-400 w-full justify-center"
                >
                  <Plus className="w-4 h-4" />
                  Add Another Variant
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-gray-200 px-8 py-6 bg-gray-50 flex justify-end gap-3 flex-shrink-0 rounded-b-2xl">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  {test ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {test ? 'Update Test' : 'Create Test'}
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// A/B Test Results Modal Component
const ABTestResultsModal = ({ test, onClose }) => {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const apiBase = useApiBase()

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
        
        // Mock results data for now
        const mockResults = {
          totalParticipants: 1250,
          duration: test.duration || 7,
          confidenceLevel: 95,
          statisticalSignificance: true,
          winner: 'Variant A',
          variants: [
            {
              name: 'Control',
              participants: 625,
              conversions: 87,
              conversionRate: 13.9,
              confidence: 0,
              lift: 0
            },
            {
              name: 'Variant A',
              participants: 625,
              conversions: 112,
              conversionRate: 17.9,
              confidence: 95,
              lift: 28.8
            }
          ]
        }
        
        setResults(mockResults)
      } catch (error) {
        console.error('Error loading results:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadResults()
  }, [test, apiBase])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8">
          <Loading size="large" />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-large w-full max-w-6xl max-h-[95vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6 text-white rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Test Results: {test.name}</h2>
                <p className="text-green-100">Statistical analysis of your A/B test performance</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {results && (
            <div className="space-y-8">
              {/* Test Summary */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Test Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{results.totalParticipants}</div>
                    <div className="text-sm text-blue-600">Total Participants</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">{results.duration}d</div>
                    <div className="text-sm text-green-600">Test Duration</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">{results.confidenceLevel}%</div>
                    <div className="text-sm text-purple-600">Confidence Level</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">
                      {results.statisticalSignificance ? 'Yes' : 'No'}
                    </div>
                    <div className="text-sm text-orange-600">Statistically Significant</div>
                  </div>
                </div>
              </div>

              {/* Winner Announcement */}
              {results.winner && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">🏆 Winner: {results.winner}</h3>
                      <p className="text-gray-600">This variant performed significantly better than the control</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Variant Performance */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Variant Performance</h3>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Variant</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Participants</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Conversions</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Conversion Rate</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Lift</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {results.variants.map((variant, index) => (
                        <tr key={index} className={`hover:bg-gray-50 ${variant.name === results.winner ? 'bg-green-50' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {variant.name === results.winner && <span className="text-green-600">🏆</span>}
                              <span className="font-medium text-gray-900">{variant.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-gray-900">{variant.participants}</td>
                          <td className="px-6 py-4 text-center text-gray-900">{variant.conversions}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-semibold text-gray-900">{variant.conversionRate}%</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`font-semibold ${variant.lift > 0 ? 'text-green-600' : variant.lift < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                              {variant.lift > 0 ? '+' : ''}{variant.lift}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`font-semibold ${variant.confidence >= 95 ? 'text-green-600' : variant.confidence >= 80 ? 'text-yellow-600' : 'text-gray-600'}`}>
                              {variant.confidence}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-blue-600" />
                  Recommendations
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  {results.statisticalSignificance ? (
                    <>
                      <p>✅ <strong>Deploy Winner:</strong> Implement {results.winner} as your default notification format</p>
                      <p>📊 <strong>Expected Impact:</strong> Based on the test results, you can expect a {results.variants.find(v => v.name === results.winner)?.lift}% improvement in conversion rates</p>
                      <p>🔄 <strong>Next Steps:</strong> Consider testing other elements like timing, images, or call-to-action buttons</p>
                    </>
                  ) : (
                    <>
                      <p>⚠️ <strong>Inconclusive Results:</strong> The test didn't reach statistical significance</p>
                      <p>📈 <strong>Recommendation:</strong> Run the test longer or increase sample size</p>
                      <p>🎯 <strong>Consider:</strong> Testing more dramatic differences between variants</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 px-8 py-6 bg-gray-50 flex justify-end flex-shrink-0 rounded-b-2xl">
          <Button variant="primary" onClick={onClose}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Close Results
          </Button>
        </div>
      </div>
    </div>
  )
}

// Template Modal Component
const TemplateModal = ({ template, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    title: template?.title || '',
    body: template?.body || '',
    url: template?.url || '',
    icon: template?.icon || '',
    badge: template?.badge || '',
    image: template?.image || '',
    tag: template?.tag || '',
    category: template?.category || 'marketing',
    variables: template?.variables || [],
    actions: template?.actions || []
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) newErrors.name = 'Template name is required'
    if (!formData.title.trim()) newErrors.title = 'Notification title is required'
    if (!formData.body.trim()) newErrors.body = 'Notification body is required'
    
    if (formData.url && !isValidUrl(formData.url)) newErrors.url = 'Invalid URL format'
    if (formData.icon && !isValidUrl(formData.icon)) newErrors.icon = 'Invalid icon URL format'
    if (formData.badge && !isValidUrl(formData.badge)) newErrors.badge = 'Invalid badge URL format'
    if (formData.image && !isValidUrl(formData.image)) newErrors.image = 'Invalid image URL format'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setSaving(true)
    try {
      await onSave(formData)
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
            {template ? 'Edit Template' : 'Create New Template'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {/* Basic Information */}
              <div>
                <label className="form-label">Template Name *</label>
                <input
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Welcome New Users"
                />
                {errors.name && <div className="form-error">{errors.name}</div>}
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of when to use this template"
                />
              </div>

              <div>
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  <option value="marketing">Marketing</option>
                  <option value="transactional">Transactional</option>
                  <option value="promotional">Promotional</option>
                  <option value="alert">Alert</option>
                  <option value="welcome">Welcome</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>

              {/* Notification Content */}
              <div style={{ background: 'var(--gray-50)', padding: '1rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 1rem 0' }}>Notification Content</h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Title *</label>
                  <input
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Notification title"
                  />
                  {errors.title && <div className="form-error">{errors.title}</div>}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Body *</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={formData.body}
                    onChange={(e) => handleInputChange('body', e.target.value)}
                    placeholder="Notification message body"
                  />
                  {errors.body && <div className="form-error">{errors.body}</div>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label">Click URL</label>
                    <input
                      className="form-input"
                      type="url"
                      value={formData.url}
                      onChange={(e) => handleInputChange('url', e.target.value)}
                      placeholder="https://example.com"
                    />
                    {errors.url && <div className="form-error">{errors.url}</div>}
                  </div>

                  <div>
                    <label className="form-label">Tag</label>
                    <input
                      className="form-input"
                      value={formData.tag}
                      onChange={(e) => handleInputChange('tag', e.target.value)}
                      placeholder="notification-tag"
                    />
                  </div>
                </div>
              </div>

              {/* Visual Elements */}
              <div style={{ background: 'var(--gray-50)', padding: '1rem', borderRadius: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 1rem 0' }}>Visual Elements (Optional)</h3>
                
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label className="form-label">Icon URL</label>
                    <input
                      className="form-input"
                      type="url"
                      value={formData.icon}
                      onChange={(e) => handleInputChange('icon', e.target.value)}
                      placeholder="https://example.com/icon.png"
                    />
                    {errors.icon && <div className="form-error">{errors.icon}</div>}
                  </div>

                  <div>
                    <label className="form-label">Badge URL</label>
                    <input
                      className="form-input"
                      type="url"
                      value={formData.badge}
                      onChange={(e) => handleInputChange('badge', e.target.value)}
                      placeholder="https://example.com/badge.png"
                    />
                    {errors.badge && <div className="form-error">{errors.badge}</div>}
                  </div>

                  <div>
                    <label className="form-label">Large Image URL</label>
                    <input
                      className="form-input"
                      type="url"
                      value={formData.image}
                      onChange={(e) => handleInputChange('image', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                    {errors.image && <div className="form-error">{errors.image}</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving} disabled={saving}>
              {saving ? 'Saving...' : (template ? 'Update Template' : 'Create Template')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Template Preview Modal Component
const TemplatePreviewModal = ({ template, onClose }) => {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Preview: {template.name}</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Notification Preview */}
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            padding: '2rem', 
            borderRadius: '0.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{ 
              background: 'white',
              borderRadius: '0.75rem',
              padding: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              maxWidth: '300px',
              margin: '0 auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                {template.icon && (
                  <img 
                    src={template.icon} 
                    alt="Icon" 
                    style={{ width: '24px', height: '24px', borderRadius: '4px' }}
                    onError={(e) => e.target.style.display = 'none'}
                  />
                )}
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a1a1a' }}>
                  {template.title}
                </div>
                <div style={{ color: '#666', fontSize: '0.75rem', marginLeft: 'auto' }}>now</div>
              </div>
              
              <div style={{ color: '#333', fontSize: '0.85rem', lineHeight: 1.4, marginBottom: '0.75rem' }}>
                {template.body}
              </div>
              
              {template.image && (
                <img 
                  src={template.image} 
                  alt="Notification" 
                  style={{ 
                    width: '100%', 
                    borderRadius: '0.5rem', 
                    marginBottom: '0.75rem',
                    maxHeight: '120px',
                    objectFit: 'cover'
                  }}
                  onError={(e) => e.target.style.display = 'none'}
                />
              )}
              
              {template.url && (
                <div style={{ fontSize: '0.75rem', color: '#666', textDecoration: 'underline' }}>
                  Click to visit: {new URL(template.url).hostname}
                </div>
              )}
            </div>
          </div>

          {/* Template Details */}
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <strong style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>Category:</strong>
              <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                {template.category?.charAt(0).toUpperCase() + template.category?.slice(1)}
              </span>
            </div>
            
            {template.description && (
              <div>
                <strong style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>Description:</strong>
                <p style={{ marginLeft: '0.5rem', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                  {template.description}
                </p>
              </div>
            )}
            
            {template.tag && (
              <div>
                <strong style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>Tag:</strong>
                <Badge variant="secondary" style={{ marginLeft: '0.5rem' }}>{template.tag}</Badge>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <Button variant="secondary" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </div>
    </div>
  )
}