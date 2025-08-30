import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, CardBody, Alert, Loading } from '../components/ui'
import { 
  Users, Bell, BarChart3, Settings, Send, Database, 
  UserCheck, MapPin, Activity, TrendingUp, CheckCircle, 
  Zap, AlertTriangle, Menu, X, User, LogOut, Home
} from 'lucide-react'

function useAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

function useApiBase() {
  const apiBaseRaw = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:4000'
  return apiBaseRaw.toString().replace(/\/?$/, '')
}

// Simple Admin Overview
const AdminOverview = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const headers = useAuthHeaders()
  const apiBase = useApiBase()

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch(`${apiBase}/api/admin/overview`, { headers })
        
        if (response.ok) {
          const data = await response.json()
          setStats({
            totalUsers: data.stats.totalUsers || 0,
            activeCustomers: data.stats.activeCustomers || 0,
            totalSubscribers: data.stats.totalSubscribers || 0,
            monthlyNotifications: data.stats.monthlyNotifications || 0,
            topCountries: data.geographic || []
          })
        } else {
          // Fallback data
          setStats({
            totalUsers: 0,
            activeCustomers: 0,
            totalSubscribers: 0,
            monthlyNotifications: 0,
            topCountries: []
          })
        }
      } catch (error) {
        console.error('Failed to load admin stats:', error)
        setStats({
          totalUsers: 0,
          activeCustomers: 0,
          totalSubscribers: 0,
          monthlyNotifications: 0,
          topCountries: []
        })
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <Loading />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">System overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
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
                <p className="text-3xl font-bold text-green-600">{stats.activeCustomers}</p>
                <p className="text-sm text-gray-500">Customer accounts</p>
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
                <p className="text-3xl font-bold text-purple-600">{stats.totalSubscribers.toLocaleString()}</p>
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
                <p className="text-sm font-medium text-gray-600">Monthly Notifications</p>
                <p className="text-3xl font-bold text-orange-600">{stats.monthlyNotifications.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Last 30 days</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Send className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Geographic Data */}
      {stats.topCountries.length > 0 && (
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-gray-400" />
              Geographic Distribution
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.topCountries.slice(0, 6).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.country}</p>
                    <p className="text-sm text-gray-500">{item.user_count} users</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{item.user_count}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

// Simple Notification Sender
const AdminNotificationSender = () => {
  const [notification, setNotification] = useState({
    title: '',
    body: '',
    url: '',
    icon: '',
    targetType: 'all'
  })
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const headers = useAuthHeaders()
  const apiBase = useApiBase()

  const handleSend = async () => {
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
          message: `Notification sent successfully to ${data.successCount || 'all'} subscribers!`
        })
        // Reset form
        setNotification({
          title: '',
          body: '',
          url: '',
          icon: '',
          targetType: 'all'
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
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Send Admin Notification</h2>
        <p className="text-gray-600">Send notifications to all subscribers</p>
      </div>

      {result && (
        <Alert className={result.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}>
          {result.message}
        </Alert>
      )}

      <Card>
        <CardBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notification Title</label>
            <input
              type="text"
              value={notification.title}
              onChange={(e) => setNotification({...notification, title: e.target.value})}
              placeholder="Enter notification title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message Body</label>
            <textarea
              value={notification.body}
              onChange={(e) => setNotification({...notification, body: e.target.value})}
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
              onChange={(e) => setNotification({...notification, url: e.target.value})}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="pt-4">
            <Button
              onClick={handleSend}
              loading={sending}
              disabled={!notification.title || !notification.body || sending}
              className="w-full"
              variant="primary"
            >
              <Send className="w-4 h-4 mr-2" />
              Send to All Subscribers
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
  )
}

// Simple placeholder pages
const PlaceholderPage = ({ title, icon: Icon, description }) => (
  <div className="p-8">
    <div className="text-center py-12">
      <Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  </div>
)

export default function AdminDashboard() {
  const [currentTab, setCurrentTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('role')
    } catch (_) {}
    navigate('/', { replace: true })
  }

  const navItems = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'send', label: 'Send Notifications', icon: Send },
    { key: 'users', label: 'Users & Customers', icon: Users },
    { key: 'analytics', label: 'Analytics', icon: TrendingUp },
    { key: 'activity', label: 'Activity Logs', icon: Activity },
    { key: 'settings', label: 'System Settings', icon: Settings },
  ]

  const renderContent = () => {
    switch (currentTab) {
      case 'overview':
        return <AdminOverview />
      case 'send':
        return <AdminNotificationSender />
      case 'users':
        return <PlaceholderPage title="User Management" icon={Users} description="Manage all users and customers" />
      case 'analytics':
        return <PlaceholderPage title="Advanced Analytics" icon={BarChart3} description="Detailed system analytics" />
      case 'activity':
        return <PlaceholderPage title="Activity Logs" icon={Activity} description="System activity logs" />
      case 'settings':
        return <PlaceholderPage title="System Settings" icon={Settings} description="System configuration" />
      default:
        return <AdminOverview />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-80 md:flex-col">
        <div className="flex flex-col flex-1 bg-gradient-to-b from-blue-50 to-white border-r border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-blue-600">NotifyPro</div>
                <div className="text-xs text-gray-500 font-medium">Admin Dashboard</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 py-4 overflow-y-auto">
            <div className="space-y-1 px-2">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setCurrentTab(item.key)}
                  className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                    currentTab === item.key
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="font-medium flex-1">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Admin</div>
                  <div className="text-xs text-gray-500">System Administrator</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-80 max-w-full bg-white">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-2">
                <Bell className="w-6 h-6 text-blue-600" />
                <span className="text-xl font-bold text-blue-600">NotifyPro</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    setCurrentTab(item.key)
                    setSidebarOpen(false)
                  }}
                  className={`flex items-center w-full px-4 py-3 text-left rounded-lg ${
                    currentTab === item.key
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="md:pl-80">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 md:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 md:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {navItems.find(item => item.key === currentTab)?.label || 'Admin Dashboard'}
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 text-gray-500 hover:text-blue-600 rounded-lg transition-colors"
                title="Back to Home"
              >
                <Home className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main>
          {renderContent()}
        </main>
      </div>
    </div>
  )
}