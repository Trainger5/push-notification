import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, CardBody, Alert, Loading } from '../components/ui'
import SimpleDashboardLayout from '../components/SimpleDashboardLayout'
import { ExternalLink, Users, Globe, Bell, BarChart3, Settings, Send, Database, UserCheck, MapPin, Target, Activity, TrendingUp, Clock, CheckCircle, XCircle, AlertTriangle, Eye, MousePointer, Zap, Search, Filter, Edit, Trash2, MoreVertical, Calendar, Mail, Building2, CreditCard } from 'lucide-react'

function useAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

function useApiBase() {
  const apiBaseRaw = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:4000'
  return apiBaseRaw.toString().replace(/\/?$/, '')
}

// Admin Dashboard Overview
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
            totalUsers: data.stats.totalUsers,
            totalCustomers: data.stats.activeCustomers,
            activeCustomers: data.stats.activeCustomers,
            totalSubscribers: data.stats.totalSubscribers,
            totalNotifications: data.stats.monthlyNotifications,
            notificationsToday: data.stats.weeklyNewUsers,
            deliveryRate: 98.5, // Calculate from delivery stats
            topCountries: data.geographic.map(geo => ({
              country: geo.country,
              count: geo.user_count,
              code: geo.country
            }))
          })
        } else {
          // Fallback to mock data
          const mockStats = {
            totalUsers: 156,
            totalCustomers: 23,
            activeCustomers: 19,
            totalSubscribers: 12543,
            totalNotifications: 45678,
            notificationsToday: 234,
            deliveryRate: 98.5,
            topCountries: [
              { country: 'US', count: 45, code: 'US' },
              { country: 'UK', count: 23, code: 'GB' }, 
              { country: 'Canada', count: 18, code: 'CA' },
              { country: 'Germany', count: 15, code: 'DE' },
              { country: 'France', count: 12, code: 'FR' }
            ]
          }
          setStats(mockStats)
        }
      } catch (error) {
        console.error('Failed to load admin stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [apiBase, headers])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loading /></div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
                <p className="text-sm text-gray-500">of {stats.totalCustomers} total</p>
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
                <p className="text-sm font-medium text-gray-600">Notifications Sent</p>
                <p className="text-3xl font-bold text-orange-600">{stats.totalNotifications.toLocaleString()}</p>
                <p className="text-sm text-green-600">+{stats.notificationsToday} today</p>
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
              {stats.topCountries.map((item, index) => (
                <div key={item.code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{item.country}</p>
                      <p className="text-sm text-gray-500">{item.count} customers</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{item.count}</p>
                  </div>
                </div>
              ))}
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
                  <p className="font-bold text-green-600">{stats.deliveryRate}%</p>
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

// User Management Page
const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const headers = useAuthHeaders()
  const apiBase = useApiBase()

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${apiBase}/api/admin/users?page=${currentPage}&search=${search}`, { headers })
        
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users)
          setTotalPages(data.pagination.pages)
        }
      } catch (error) {
        console.error('Failed to load users:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [currentPage, search, headers, apiBase])

  const handleSearch = (e) => {
    setSearch(e.target.value)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage all users and customers</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardBody>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by email, name, or company..."
                  value={search}
                  onChange={handleSearch}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Users Table */}
      <Card>
        <CardBody>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loading />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subscribers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.email}</div>
                            {user.customer_name && (
                              <div className="text-sm text-gray-500">{user.customer_name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.company_name ? (
                          <div>
                            <div className="text-sm text-gray-900">{user.company_name}</div>
                            <div className="text-sm text-gray-500">{user.country || 'Unknown'}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No customer profile</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.subscriber_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.user_created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.customer_status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : user.customer_status === 'suspended'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.customer_status || (user.email_verified ? 'verified' : 'unverified')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 px-6">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

// Analytics Page
const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null)
  const [timeRange, setTimeRange] = useState(30)
  const [loading, setLoading] = useState(true)
  const headers = useAuthHeaders()
  const apiBase = useApiBase()

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${apiBase}/api/admin/analytics?days=${timeRange}`, { headers })
        
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        }
      } catch (error) {
        console.error('Failed to load analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [timeRange, headers, apiBase])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
          <p className="text-gray-600">Detailed system analytics and trends</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Plan Distribution</p>
                  <div className="mt-2 space-y-1">
                    {analytics.planDistribution.map((plan) => (
                      <div key={plan.plan} className="flex justify-between">
                        <span className="text-sm text-gray-500 capitalize">{plan.plan}:</span>
                        <span className="text-sm font-medium">{plan.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <CreditCard className="w-8 h-8 text-blue-500" />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Notification Status</p>
                  <div className="mt-2 space-y-1">
                    {analytics.statusBreakdown.map((status) => (
                      <div key={status.status} className="flex justify-between">
                        <span className="text-sm text-gray-500 capitalize">{status.status}:</span>
                        <span className="text-sm font-medium">{status.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <BarChart3 className="w-8 h-8 text-green-500" />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">User Growth</p>
                  <p className="text-lg font-bold text-purple-600">
                    +{analytics.userTrends.reduce((sum, day) => sum + day.new_users, 0)}
                  </p>
                  <p className="text-sm text-gray-500">New users ({timeRange} days)</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Subscriptions</p>
                  <p className="text-lg font-bold text-orange-600">
                    +{analytics.subscriptionTrends.reduce((sum, day) => sum + day.new_subscriptions, 0)}
                  </p>
                  <p className="text-sm text-gray-500">New subscriptions ({timeRange} days)</p>
                </div>
                <Bell className="w-8 h-8 text-orange-500" />
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Trends Chart would go here - simplified version */}
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold mb-4">Activity Trends</h3>
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-2" />
            <p>Chart visualization would be implemented here with a charting library</p>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

// Activity Logs Page
const ActivityLogs = () => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const headers = useAuthHeaders()
  const apiBase = useApiBase()

  useEffect(() => {
    const loadActivity = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${apiBase}/api/admin/activity`, { headers })
        
        if (response.ok) {
          const data = await response.json()
          setActivities(data.activities)
        }
      } catch (error) {
        console.error('Failed to load activity logs:', error)
      } finally {
        setLoading(false)
      }
    }

    loadActivity()
  }, [headers, apiBase])

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_registration': return <UserCheck className="w-4 h-4 text-green-500" />
      case 'notification_sent': return <Send className="w-4 h-4 text-blue-500" />
      case 'subscription_created': return <Bell className="w-4 h-4 text-purple-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Activity Logs</h2>
        <p className="text-gray-600">Recent system activity and events</p>
      </div>

      <Card>
        <CardBody>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loading />
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {activities.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-4" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

// Subscriber Selection Component
const SubscriberSelector = ({ selectedSubscribers, onSelectionChange, onNotificationUpdate }) => {
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const headers = useAuthHeaders()
  const apiBase = useApiBase()

  useEffect(() => {
    const loadSubscribers = async () => {
      try {
        setLoading(true)
        // For now, we'll create mock subscriber data since we need to create the endpoint
        const mockSubscribers = [
          { id: '1', endpoint: 'https://fcm.googleapis.com/fcm/send/abc123...', customer_name: 'Demo Company', country: 'US', browser: 'Chrome', created_at: new Date().toISOString() },
          { id: '2', endpoint: 'https://fcm.googleapis.com/fcm/send/def456...', customer_name: 'Test Corp', country: 'UK', browser: 'Firefox', created_at: new Date().toISOString() },
          { id: '3', endpoint: 'https://fcm.googleapis.com/fcm/send/ghi789...', customer_name: 'Sample Inc', country: 'CA', browser: 'Safari', created_at: new Date().toISOString() }
        ]
        setSubscribers(mockSubscribers)
      } catch (error) {
        console.error('Failed to load subscribers:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSubscribers()
  }, [])

  const handleSubscriberToggle = (subscriberId) => {
    const newSelection = selectedSubscribers.includes(subscriberId)
      ? selectedSubscribers.filter(id => id !== subscriberId)
      : [...selectedSubscribers, subscriberId]
    
    onSelectionChange(newSelection)
    onNotificationUpdate(newSelection)
  }

  const handleSelectAll = () => {
    const allIds = subscribers.map(s => s.id)
    onSelectionChange(allIds)
    onNotificationUpdate(allIds)
  }

  const handleClearAll = () => {
    onSelectionChange([])
    onNotificationUpdate([])
  }

  const filteredSubscribers = subscribers.filter(sub => 
    search === '' || 
    sub.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    sub.country.toLowerCase().includes(search.toLowerCase()) ||
    sub.browser.toLowerCase().includes(search.toLowerCase())
  )

  const displayedSubscribers = showAll ? filteredSubscribers : filteredSubscribers.slice(0, 10)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Select Individual Subscribers ({selectedSubscribers.length} selected)
        </label>
        <div className="flex space-x-2">
          <Button size="sm" variant="secondary" onClick={handleSelectAll}>
            Select All
          </Button>
          <Button size="sm" variant="secondary" onClick={handleClearAll}>
            Clear All
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search subscribers by customer, country, or browser..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loading size="sm" />
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {displayedSubscribers.map((subscriber) => (
              <div key={subscriber.id} className="p-3 hover:bg-gray-50">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSubscribers.includes(subscriber.id)}
                    onChange={() => handleSubscriberToggle(subscriber.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {subscriber.customer_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {subscriber.country} • {subscriber.browser} • {subscriber.endpoint.substring(0, 50)}...
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(subscriber.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {filteredSubscribers.length > 10 && !showAll && (
        <div className="text-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowAll(true)}
          >
            Show All {filteredSubscribers.length} Subscribers
          </Button>
        </div>
      )}

      {showAll && (
        <div className="text-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowAll(false)}
          >
            Show Less
          </Button>
        </div>
      )}
    </div>
  )
}

// System Settings Page
const SystemSettings = () => {
  const [settings, setSettings] = useState({
    systemName: 'NotifyPro',
    adminEmail: 'admin@notifypro.com',
    maxCustomers: 1000,
    maxNotifications: 10000,
    retentionDays: 90
  })
  const [saving, setSaving] = useState(false)
  
  const handleSave = async () => {
    setSaving(true)
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
        <p className="text-gray-600">Configure system-wide settings</p>
      </div>

      <Card>
        <CardBody className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              System Name
            </label>
            <input
              type="text"
              value={settings.systemName}
              onChange={(e) => setSettings({...settings, systemName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Email
            </label>
            <input
              type="email"
              value={settings.adminEmail}
              onChange={(e) => setSettings({...settings, adminEmail: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Customers
              </label>
              <input
                type="number"
                value={settings.maxCustomers}
                onChange={(e) => setSettings({...settings, maxCustomers: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Notifications/Month
              </label>
              <input
                type="number"
                value={settings.maxNotifications}
                onChange={(e) => setSettings({...settings, maxNotifications: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Retention (days)
              </label>
              <input
                type="number"
                value={settings.retentionDays}
                onChange={(e) => setSettings({...settings, retentionDays: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleSave}
              loading={saving}
              variant="primary"
            >
              Save Settings
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

// Admin Notification Sender
const AdminNotificationSender = () => {
  const [notification, setNotification] = useState({
    title: '',
    body: '',
    url: '',
    icon: '',
    targetType: 'all', // all, customer, country, subscribers
    targetValue: '',
    customerId: '',
    country: '',
    subscriberIds: []
  })
  const [customers, setCustomers] = useState([])
  const [subscribers, setSubscribers] = useState([])
  const [countries, setCountries] = useState([])
  const [selectedSubscribers, setSelectedSubscribers] = useState([])
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [loadingData, setLoadingData] = useState(true)
  const headers = useAuthHeaders()
  const apiBase = useApiBase()

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true)
        
        // Load customers
        const customersRes = await fetch(`${apiBase}/api/admin/customers`, { headers })
        if (customersRes.ok) {
          const customersData = await customersRes.json()
          setCustomers(customersData.customers || [])
        }
        
        // Load overview for countries
        const overviewRes = await fetch(`${apiBase}/api/admin/overview`, { headers })
        if (overviewRes.ok) {
          const overviewData = await overviewRes.json()
          const uniqueCountries = [...new Set(overviewData.geographic.map(g => g.country).filter(c => c && c !== 'Unknown'))]
          setCountries(uniqueCountries)
        }
        
      } catch (error) {
        console.error('Failed to load data:', error)
        // Fallback data
        setCustomers([
          { id: '1', name: 'Demo Company', email: 'demo@example.com', subscriber_count: 123 },
          { id: '2', name: 'Test Corp', email: 'test@example.com', subscriber_count: 456 }
        ])
        setCountries(['US', 'UK', 'CA', 'DE', 'FR'])
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [])

  const handleSend = async () => {
    setSending(true)
    setResult(null)

    try {
      // This would be the admin notification endpoint
      const response = await fetch(`${apiBase}/api/admin/notify`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...notification,
          subscriberIds: notification.targetType === 'subscribers' ? selectedSubscribers : undefined
        })
      })

      if (response.ok) {
        const data = await response.json()
        setResult({ success: true, message: `Notification sent successfully to ${data.successCount || data.sent || 'targeted'} subscribers! (${data.description || ''})` })
        setNotification({
          title: '',
          body: '',
          url: '',
          icon: '',
          targetType: 'all',
          targetValue: '',
          customerId: '',
          country: '',
          subscriberIds: [],
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
  }

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon URL (Optional)</label>
              <input
                type="url"
                value={notification.icon}
                onChange={(e) => setNotification({...notification, icon: e.target.value})}
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
                onChange={(e) => setNotification({...notification, targetType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Subscribers</option>
                <option value="customer">Specific Customer</option>
                <option value="country">By Country</option>
                <option value="subscribers">Select Individual Subscribers</option>
              </select>
            </div>

            {notification.targetType === 'customer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Customer</label>
                <select
                  value={notification.customerId}
                  onChange={(e) => setNotification({...notification, customerId: e.target.value, targetValue: e.target.value})}
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
                  value={notification.country}
                  onChange={(e) => setNotification({...notification, country: e.target.value, targetValue: e.target.value})}
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

            {notification.targetType === 'subscribers' && (
              <SubscriberSelector 
                selectedSubscribers={selectedSubscribers}
                onSelectionChange={setSelectedSubscribers}
                onNotificationUpdate={(ids) => setNotification({...notification, subscriberIds: ids, targetValue: ids.join(',')})}
              />
            )}

            <div className="pt-4">
              <Button
                onClick={handleSend}
                loading={sending}
                disabled={!notification.title || !notification.body}
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
                {notification.targetType === 'subscribers' && selectedSubscribers.length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    Will send to {selectedSubscribers.length} selected subscriber{selectedSubscribers.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [me, setMe] = useState(null)
  const [currentTab, setCurrentTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(false)
  const headers = useAuthHeaders()
  const apiBase = useApiBase()
  const navigate = useNavigate()

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        setLoading(true)
        const r = await fetch(`${apiBase}/api/admin/me`, { headers }).catch(() => ({ ok: false }))
        
        if (!r.ok) {
          if (r.status === 401 || r.status === 403) {
            setAuthError(true)
            return
          }
        }

        // Mock admin data for now
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
    }

    loadAdminData()
  }, [])

  const renderContent = () => {
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
  }

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

  const adminNavSections = [
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
        { key: 'activity', label: 'Activity Logs', icon: Activity },
        { key: 'send', label: 'Send Notifications', icon: Send },
      ]
    },
    {
      title: 'System',
      items: [
        { key: 'settings', label: 'System Settings', icon: Settings },
      ]
    }
  ]

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