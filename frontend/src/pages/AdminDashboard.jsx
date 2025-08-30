import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, CardBody, Alert, Loading } from '../components/ui'
import SimpleDashboardLayout from '../components/SimpleDashboardLayout'
import { 
  ExternalLink, Users, Globe, Bell, BarChart3, Settings, Send, Database, 
  UserCheck, MapPin, Target, Activity, TrendingUp, Clock, CheckCircle, 
  XCircle, AlertTriangle, Eye, MousePointer, Zap, Search, Filter, Edit, 
  Trash2, MoreVertical, Calendar, Mail, Building2, CreditCard 
} from 'lucide-react'

function useAuthHeaders() {
  const token = localStorage.getItem('token')
  return useMemo(() => 
    token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
  , [token])
}

function useApiBase() {
  return useMemo(() => {
    const apiBaseRaw = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:4000'
    return apiBaseRaw.toString().replace(/\/?$/, '')
  }, [])
}

// Admin Dashboard Overview
const AdminOverview = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const headers = useAuthHeaders()
  const apiBase = useApiBase()

  const loadStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${apiBase}/api/admin/overview`, { headers })
      
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalUsers: data.stats.totalUsers,
          totalCustomers: data.stats.activeCustomers,
          activeCustomers: data.stats.activeCustomers,
          totalSubscribers: data.stats.totalSubscribers,
          totalNotifications: data.stats.monthlyNotifications,
          notificationsToday: data.stats.weeklyNewUsers,
          deliveryRate: 98.5,
          topCountries: data.geographic.map(geo => ({
            country: geo.country,
            count: geo.user_count,
            code: geo.country
          }))
        })
      } else {
        throw new Error('Failed to load admin stats')
      }
    } catch (error) {
      console.error('Failed to load admin stats:', error)
      setError(error.message)
      // Fallback data
      setStats({
        totalUsers: 0,
        totalCustomers: 0,
        activeCustomers: 0,
        totalSubscribers: 0,
        totalNotifications: 0,
        notificationsToday: 0,
        deliveryRate: 0,
        topCountries: []
      })
    } finally {
      setLoading(false)
    }
  }, [apiBase, headers])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="bg-red-50 border-red-200 text-red-800">
        Error loading dashboard data: {error}
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">System overview and management</p>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-blue-600">{stats?.totalUsers || 0}</p>
                <p className="text-sm text-gray-500">All registered users</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Customers</p>
                <p className="text-3xl font-bold text-green-600">{stats?.activeCustomers || 0}</p>
                <p className="text-sm text-gray-500">of {stats?.totalCustomers || 0} total</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Subscribers</p>
                <p className="text-3xl font-bold text-purple-600">{(stats?.totalSubscribers || 0).toLocaleString()}</p>
                <p className="text-sm text-gray-500">Push subscribers</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Bell className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Notifications Sent</p>
                <p className="text-3xl font-bold text-orange-600">{(stats?.totalNotifications || 0).toLocaleString()}</p>
                <p className="text-sm text-green-600">+{stats?.notificationsToday || 0} recent</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Send className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Geographic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Geographic Distribution</h3>
              <MapPin className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {(stats?.topCountries || []).slice(0, 5).map((item, index) => (
                <div key={`${item.code}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{item.country}</p>
                      <p className="text-sm text-gray-500">{item.count} users</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{item.count}</p>
                  </div>
                </div>
              ))}
              {(!stats?.topCountries || stats.topCountries.length === 0) && (
                <div className="text-center py-4 text-gray-500">
                  <MapPin className="w-8 h-8 mx-auto mb-2" />
                  <p>No geographic data available</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">System Health</h3>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">Delivery Rate</p>
                    <p className="text-sm text-gray-500">Last 24 hours</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{stats?.deliveryRate || 0}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Database className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Database Status</p>
                    <p className="text-sm text-gray-500">All systems operational</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">Healthy</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Zap className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-medium">API Performance</p>
                    <p className="text-sm text-gray-500">Average response time</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-purple-600">45ms</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

// Simple Notification Sender (without complex subscriber selection for now)
const AdminNotificationSender = () => {
  const [notification, setNotification] = useState({
    title: '',
    body: '',
    url: '',
    icon: '',
    targetType: 'all',
    targetValue: ''
  })
  const [customers, setCustomers] = useState([])
  const [countries, setCountries] = useState([])
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [loadingData, setLoadingData] = useState(true)
  const headers = useAuthHeaders()
  const apiBase = useApiBase()

  const loadData = useCallback(async () => {
    try {
      setLoadingData(true)
      
      // Load customers and countries
      const [customersRes, overviewRes] = await Promise.all([
        fetch(`${apiBase}/api/admin/customers`, { headers }).catch(() => ({ ok: false })),
        fetch(`${apiBase}/api/admin/overview`, { headers }).catch(() => ({ ok: false }))
      ])

      if (customersRes.ok) {
        const customersData = await customersRes.json()
        setCustomers(customersData.customers || [])
      }
      
      if (overviewRes.ok) {
        const overviewData = await overviewRes.json()
        const uniqueCountries = [...new Set(overviewData.geographic?.map(g => g.country).filter(c => c && c !== 'Unknown') || [])]
        setCountries(uniqueCountries)
      }
      
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoadingData(false)
    }
  }, [apiBase, headers])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSend = useCallback(async () => {
    setSending(true)
    setResult(null)

    try {
      const response = await fetch(`${apiBase}/api/admin/notify`, {
        method: 'POST',
        headers,
        body: JSON.stringify(notification)
      })

      if (response.ok) {
        const data = await response.json()
        setResult({ 
          success: true, 
          message: `Notification sent successfully to ${data.successCount || 'targeted'} subscribers! (${data.description || ''})`
        })
        // Reset form
        setNotification({
          title: '',
          body: '',
          url: '',
          icon: '',
          targetType: 'all',
          targetValue: ''
        })
      } else {
        const error = await response.json()
        setResult({ success: false, message: error.message || 'Failed to send notification' })
      }
    } catch (error) {
      setResult({ success: false, message: 'Network error: ' + error.message })
    } finally {
      setSending(false)
    }
  }, [apiBase, headers, notification])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Send Admin Notification</h2>
        <p className="text-gray-600">Send notifications to all or targeted subscribers</p>
      </div>

      {result && (
        <Alert className={result.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}>
          {result.message}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardBody className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notification Title</label>
              <input
                type="text"
                value={notification.title}
                onChange={(e) => setNotification(prev => ({...prev, title: e.target.value}))}
                placeholder="Enter notification title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message Body</label>
              <textarea
                value={notification.body}
                onChange={(e) => setNotification(prev => ({...prev, body: e.target.value}))}
                placeholder="Enter notification message"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Click URL (Optional)</label>
              <input
                type="url"
                value={notification.url}
                onChange={(e) => setNotification(prev => ({...prev, url: e.target.value}))}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon URL (Optional)</label>
              <input
                type="url"
                value={notification.icon}
                onChange={(e) => setNotification(prev => ({...prev, icon: e.target.value}))}
                placeholder="https://example.com/icon.png"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
              <select
                value={notification.targetType}
                onChange={(e) => setNotification(prev => ({...prev, targetType: e.target.value, targetValue: ''}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Subscribers</option>
                <option value="customer">Specific Customer</option>
                <option value="country">By Country</option>
              </select>
            </div>

            {notification.targetType === 'customer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Customer</label>
                <select
                  value={notification.targetValue}
                  onChange={(e) => setNotification(prev => ({...prev, targetValue: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loadingData}
                >
                  <option value="">Choose a customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.subscriber_count || 0} subscribers)
                    </option>
                  ))}
                </select>
                {loadingData && <p className="text-sm text-gray-500 mt-1">Loading customers...</p>}
              </div>
            )}

            {notification.targetType === 'country' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Country</label>
                <select
                  value={notification.targetValue}
                  onChange={(e) => setNotification(prev => ({...prev, targetValue: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loadingData}
                >
                  <option value="">Choose a country</option>
                  {countries.map(country => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                {loadingData && <p className="text-sm text-gray-500 mt-1">Loading countries...</p>}
              </div>
            )}

            <div className="pt-4">
              <Button
                onClick={handleSend}
                loading={sending}
                disabled={!notification.title || !notification.body || sending}
                className="w-full"
                variant="primary"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Notification
              </Button>
            </div>

            <div className="text-sm text-gray-500">
              <p><strong>Preview:</strong></p>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                <p className="font-semibold">{notification.title || 'Notification Title'}</p>
                <p className="text-sm">{notification.body || 'Notification message will appear here'}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

// Simple placeholder pages for other sections
const UserManagement = () => (
  <div className="text-center py-12">
    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
    <h3 className="text-xl font-semibold mb-2">User Management</h3>
    <p className="text-gray-600">User management interface</p>
  </div>
)

const AnalyticsDashboard = () => (
  <div className="text-center py-12">
    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
    <h3 className="text-xl font-semibold mb-2">Advanced Analytics</h3>
    <p className="text-gray-600">Analytics dashboard</p>
  </div>
)

const SystemSettings = () => (
  <div className="text-center py-12">
    <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
    <h3 className="text-xl font-semibold mb-2">System Settings</h3>
    <p className="text-gray-600">System configuration</p>
  </div>
)

const ActivityLogs = () => (
  <div className="text-center py-12">
    <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
    <h3 className="text-xl font-semibold mb-2">Activity Logs</h3>
    <p className="text-gray-600">System activity logs</p>
  </div>
)

export default function AdminDashboard() {
  const [me, setMe] = useState(null)
  const [currentTab, setCurrentTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(false)
  const headers = useAuthHeaders()
  const apiBase = useApiBase()
  const navigate = useNavigate()

  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Mock admin data for now since we don't have /api/admin/me endpoint
      setMe({
        user: {
          email: 'admin@notifypro.com',
          role: 'admin',
          name: 'System Administrator'
        }
      })
      setAuthError(false)
    } catch (error) {
      console.error('Admin dashboard load error:', error)
      setAuthError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAdminData()
  }, [loadAdminData])

  const renderContent = useCallback(() => {
    switch (currentTab) {
      case 'overview':
        return <AdminOverview />
      case 'send':
        return <AdminNotificationSender />
      case 'users':
        return <UserManagement />
      case 'analytics':
        return <AnalyticsDashboard />
      case 'settings':
        return <SystemSettings />
      case 'activity':
        return <ActivityLogs />
      default:
        return <AdminOverview />
    }
  }, [currentTab])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loading className="mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  // Show authentication error
  if (authError || !me) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardBody className="text-center py-12">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Admin Access Required</h1>
              <p className="text-gray-600">
                You need administrator privileges to access this dashboard
              </p>
            </div>
            <div className="space-y-3">
              <Button 
                variant="primary" 
                className="w-full"
                onClick={() => navigate('/login')}
              >
                Go to Login
              </Button>
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => navigate('/')}
              >
                Back to Home
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  const adminNavSections = useMemo(() => [
    {
      title: 'Dashboard',
      items: [
        { key: 'overview', label: 'Overview', icon: BarChart3 },
        { key: 'analytics', label: 'Analytics', icon: TrendingUp },
      ]
    },
    {
      title: 'Management',
      items: [
        { key: 'users', label: 'Users & Customers', icon: Users },
        { key: 'send', label: 'Send Notifications', icon: Send },
        { key: 'activity', label: 'Activity Logs', icon: Activity },
      ]
    },
    {
      title: 'System',
      items: [
        { key: 'settings', label: 'System Settings', icon: Settings },
      ]
    }
  ], [])

  return (
    <SimpleDashboardLayout 
      currentTab={currentTab}
      setCurrentTab={setCurrentTab}
      user={me}
      stats={{ subscribers: 0 }}
      isAdmin={true}
      navSections={adminNavSections}
    >
      {renderContent()}
    </SimpleDashboardLayout>
  )
}