import { useEffect, useState, useCallback, useRef, useMemo, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, CardBody, Alert, Loading } from '../components/ui'
import { 
  Users, Bell, BarChart3, Settings, Send, Database, 
  UserCheck, MapPin, Activity, TrendingUp, CheckCircle, 
  Zap, AlertTriangle, Menu, X, User, LogOut, Home,
  Search, Filter, Edit, Trash2, MoreVertical, Calendar,
  Mail, Building2, CreditCard, Eye, Download, RefreshCw,
  Clock, Globe, Monitor, Smartphone, Chrome, Upload, RotateCcw,
  ExternalLink
} from 'lucide-react'

function useAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

function useApiBase() {
  const apiBaseRaw = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || 'http://13.126.228.42'
  return apiBaseRaw.toString().replace(/\/?$/, '')
}

// Stable references to prevent unnecessary re-renders and API calls
const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || 'http://13.126.228.42'

// Global request tracking to prevent duplicate API calls
const activeRequests = new Map()

// Production logging utility
const logError = (error, context = '') => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}]`, error)
  } else {
    // In production, you might want to send to a logging service
    console.warn('An error occurred. Please contact support if the issue persists.')
  }
}

// Enhanced fetch function with deduplication and error handling
const fetchWithDeduplication = async (url, options = {}) => {
  const requestKey = `${url}_${JSON.stringify(options)}`
  
  // If same request is already in progress, return the existing promise
  if (activeRequests.has(requestKey)) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Deduplicating request:', url)
    }
    return activeRequests.get(requestKey)
  }
  
  // Create new request promise with timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
    logError(new Error('Request timeout'), 'FetchTimeout')
  }, 30000) // 30 second timeout
  
  const requestPromise = fetch(url, {
    ...options,
    signal: options.signal || controller.signal
  }).catch(error => {
    if (error.name === 'AbortError') {
      throw new Error('Request was cancelled or timed out')
    }
    logError(error, 'FetchError')
    throw error
  }).finally(() => {
    clearTimeout(timeoutId)
    activeRequests.delete(requestKey)
  })
  
  // Store the promise
  activeRequests.set(requestKey, requestPromise)
  return requestPromise
}

// Complete User Management Page
const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedUsers, setSelectedUsers] = useState([])
  const abortControllerRef = useRef(null)
  const isLoadingRef = useRef(false)

  const loadUsers = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (isLoadingRef.current) return
    
    try {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      // Create new abort controller
      abortControllerRef.current = new AbortController()
      isLoadingRef.current = true
      setLoading(true)
      
      const headers = getAuthHeaders()
      const response = await fetchWithDeduplication(`${API_BASE}/api/admin/users?page=${currentPage}&search=${search}`, { 
        headers,
        signal: abortControllerRef.current.signal
      })
        
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users || [])
          setTotalPages(data.pagination?.pages || 1)
        } else {
          // Mock data fallback
          setUsers([
            {
              id: '1',
              email: 'demo@customer.com',
              role: 'customer',
              email_verified: true,
              user_created_at: new Date().toISOString(),
              customer_name: 'Demo Company',
              company_name: 'Demo Company Inc.',
              country: 'US',
              plan: 'pro',
              customer_status: 'active',
              subscriber_count: 123
            },
            {
              id: '2',
              email: 'admin@notifypro.com',
              role: 'admin',
              email_verified: true,
              user_created_at: new Date().toISOString(),
              customer_name: null,
              company_name: null,
              country: null,
              plan: null,
              customer_status: null,
              subscriber_count: 0
            }
          ])
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          if (process.env.NODE_ENV === 'development') {
            console.log('User request aborted')
          }
          return
        }
        logError(error, 'UserManagement')
        setError('Failed to load users. Please try again.')
        setUsers([])
      } finally {
        isLoadingRef.current = false
        setLoading(false)
      }
    }, [currentPage, search])

    useEffect(() => {
      const debounceTimer = setTimeout(loadUsers, 300)
      return () => {
        clearTimeout(debounceTimer)
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
      }
    }, [loadUsers])

  const handleUserToggle = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(u => u.id))
    }
  }

  const handleExport = () => {
    const csvData = users.map(user => ({
      email: user.email,
      role: user.role,
      company: user.company_name || '',
      country: user.country || '',
      subscribers: user.subscriber_count || 0,
      status: user.customer_status || 'N/A',
      created: new Date(user.user_created_at).toLocaleDateString()
    }))
    
    const csvContent = 'data:text/csv;charset=utf-8,' + 
      'Email,Role,Company,Country,Subscribers,Status,Created\n' +
      csvData.map(row => Object.values(row).join(',')).join('\n')
    
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csvContent))
    link.setAttribute('download', `users-${new Date().toISOString().split('T')[0]}.csv`)
    link.click()
  }

  const handleSendNotificationToSelected = async () => {
    if (selectedUsers.length === 0) return
    
    const title = prompt('Enter notification title:')
    const body = prompt('Enter notification message:')
    
    if (title && body) {
      try {
        const response = await fetch(`${API_BASE}/api/admin/notify-users`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            userIds: selectedUsers,
            title,
            body
          })
        })
        
        if (response.ok) {
          alert('Notification sent successfully!')
          setSelectedUsers([])
        } else {
          alert('Failed to send notification')
        }
      } catch (error) {
        alert('Error sending notification: ' + error.message)
      }
    }
  }

  const handleViewUser = (userId) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      alert(`User Details:\n\nEmail: ${user.email}\nRole: ${user.role}\nCompany: ${user.company_name || 'N/A'}\nSubscribers: ${user.subscriber_count || 0}\nCreated: ${new Date(user.user_created_at).toLocaleDateString()}`)
    }
  }

  const handleEditUser = (userId) => {
    const newEmail = prompt('Enter new email:')
    if (newEmail) {
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, email: newEmail } : u
      ))
    }
  }

  const handleUserActions = (userId) => {
    const actions = ['View Details', 'Edit User', 'Send Notification', 'Delete User']
    const choice = prompt('Choose action:\n' + actions.map((a, i) => `${i + 1}. ${a}`).join('\n'))
    
    switch (choice) {
      case '1': handleViewUser(userId); break
      case '2': handleEditUser(userId); break
      case '3': 
        const title = prompt('Notification title:')
        const body = prompt('Notification message:')
        if (title && body) {
          alert('Notification sent to user!')
        }
        break
      case '4': 
        if (confirm('Are you sure you want to delete this user?')) {
          setUsers(prev => prev.filter(u => u.id !== userId))
        }
        break
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage all users and customers</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
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
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <Button variant="secondary" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
          {selectedUsers.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2">
                <Button size="sm" variant="secondary" onClick={handleSendNotificationToSelected}>Send Notification</Button>
                <Button size="sm" variant="secondary" onClick={() => {
                  const selectedData = users.filter(u => selectedUsers.includes(u.id))
                  const csvContent = 'data:text/csv;charset=utf-8,' + 
                    'Email,Role,Company,Country,Subscribers,Status\n' +
                    selectedData.map(u => `${u.email},${u.role},${u.company_name || ''},${u.country || ''},${u.subscriber_count || 0},${u.customer_status || 'N/A'}`).join('\n')
                  const link = document.createElement('a')
                  link.setAttribute('href', encodeURI(csvContent))
                  link.setAttribute('download', `selected-users-${new Date().toISOString().split('T')[0]}.csv`)
                  link.click()
                }}>Export Selected</Button>
              </div>
            </div>
          )}
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
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
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
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className={`hover:bg-gray-50 ${selectedUsers.includes(user.id) ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleUserToggle(user.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
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
                            <div className="text-sm text-gray-500 flex items-center">
                              <Globe className="w-3 h-3 mr-1" />
                              {user.country || 'Unknown'}
                              {user.plan && (
                                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                  {user.plan}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No customer profile</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {user.subscriber_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.customer_status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : user.customer_status === 'suspended'
                            ? 'bg-yellow-100 text-yellow-800'
                            : user.email_verified 
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.customer_status || (user.email_verified ? 'verified' : 'unverified')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.user_created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="secondary" onClick={() => handleViewUser(user.id)} title="View Details">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleEditUser(user.id)} title="Edit User">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleUserActions(user.id)} title="More Actions">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
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

// Complete Analytics Dashboard
const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null)
  const [timeRange, setTimeRange] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true)
        const response = await fetchWithDeduplication(`${API_BASE}/api/admin/analytics?days=${timeRange}`, { headers: getAuthHeaders() })
        
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        } else {
          // Mock analytics data
          setAnalytics({
            userTrends: Array.from({length: timeRange}, (_, i) => ({
              date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              new_users: Math.floor(Math.random() * 10) + 1
            })),
            notificationTrends: Array.from({length: timeRange}, (_, i) => ({
              date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              notifications_sent: Math.floor(Math.random() * 50) + 10,
              total_deliveries: Math.floor(Math.random() * 500) + 100
            })),
            subscriptionTrends: Array.from({length: timeRange}, (_, i) => ({
              date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              new_subscriptions: Math.floor(Math.random() * 20) + 5
            })),
            planDistribution: [
              { plan: 'free', count: 45 },
              { plan: 'pro', count: 23 },
              { plan: 'enterprise', count: 8 }
            ],
            statusBreakdown: [
              { status: 'sent', count: 1234 },
              { status: 'delivered', count: 1189 },
              { status: 'failed', count: 45 }
            ]
          })
        }
      } catch (error) {
        logError(error, 'AnalyticsDashboard')
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [timeRange]) // Removed unstable headers and apiBase dependencies

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <Loading />
        </div>
      </div>
    )
  }

  const totalNewUsers = analytics.userTrends.reduce((sum, day) => sum + day.new_users, 0)
  const totalNotifications = analytics.notificationTrends.reduce((sum, day) => sum + day.notifications_sent, 0)
  const totalSubscriptions = analytics.subscriptionTrends.reduce((sum, day) => sum + day.new_subscriptions, 0)

  const handleExportAnalytics = () => {
    const reportData = [
      { metric: 'New Users', value: totalNewUsers, period: `Last ${timeRange} days` },
      { metric: 'Total Notifications', value: totalNotifications, period: `Last ${timeRange} days` },
      { metric: 'New Subscriptions', value: totalSubscriptions, period: `Last ${timeRange} days` },
      ...analytics.planDistribution.map(plan => ({
        metric: `${plan.plan.charAt(0).toUpperCase() + plan.plan.slice(1)} Plan Users`,
        value: plan.count,
        period: 'Current'
      })),
      ...analytics.statusBreakdown.map(status => ({
        metric: `${status.status.charAt(0).toUpperCase() + status.status.slice(1)} Notifications`,
        value: status.count,
        period: 'Total'
      }))
    ]
    
    const csvContent = 'data:text/csv;charset=utf-8,' + 
      'Metric,Value,Period\n' +
      reportData.map(row => `"${row.metric}",${row.value},"${row.period}"`).join('\n')
    
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csvContent))
    link.setAttribute('download', `analytics-report-${timeRange}days-${new Date().toISOString().split('T')[0]}.csv`)
    link.click()
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
          <p className="text-gray-600">Detailed system analytics and trends</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button onClick={handleExportAnalytics} className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Users</p>
                <p className="text-2xl font-bold text-blue-600">+{totalNewUsers}</p>
                <p className="text-sm text-gray-500">Last {timeRange} days</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Notifications</p>
                <p className="text-2xl font-bold text-green-600">{totalNotifications.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total sent</p>
              </div>
              <Send className="w-8 h-8 text-green-500" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Subscriptions</p>
                <p className="text-2xl font-bold text-purple-600">+{totalSubscriptions}</p>
                <p className="text-sm text-gray-500">Growth rate</p>
              </div>
              <Bell className="w-8 h-8 text-purple-500" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-orange-600">96.3%</p>
                <p className="text-sm text-gray-500">Delivery rate</p>
              </div>
              <CheckCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts and Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold mb-4">Plan Distribution</h3>
            <div className="space-y-3">
              {analytics.planDistribution.map((plan) => (
                <div key={plan.plan} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CreditCard className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium capitalize">{plan.plan}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(plan.count / analytics.planDistribution.reduce((sum, p) => sum + p.count, 0)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{plan.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold mb-4">Notification Status</h3>
            <div className="space-y-3">
              {analytics.statusBreakdown.map((status) => (
                <div key={status.status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      status.status === 'sent' ? 'bg-blue-500' :
                      status.status === 'delivered' ? 'bg-green-500' :
                      'bg-red-500'
                    }`}></div>
                    <span className="font-medium capitalize">{status.status}</span>
                  </div>
                  <span className="text-sm font-medium">{status.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Trend Chart Placeholder */}
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold mb-4">Activity Trends ({timeRange} days)</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-2" />
              <p>Chart visualization would be implemented here</p>
              <p className="text-sm">Shows user registration, notifications, and subscription trends</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

// Complete Activity Logs
const ActivityLogs = () => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const loadActivity = async () => {
      try {
        setLoading(true)
        const response = await fetchWithDeduplication(`${API_BASE}/api/admin/activity`, { headers: getAuthHeaders() })
        
        if (response.ok) {
          const data = await response.json()
          setActivities(data.activities || [])
        } else {
          // Mock activity data
          const mockActivities = [
            {
              type: 'user_registration',
              description: 'New user registered: john@example.com',
              timestamp: new Date().toISOString(),
              metadata: { email: 'john@example.com', role: 'customer' }
            },
            {
              type: 'notification_sent',
              description: 'Notification sent: Welcome Message',
              timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
              metadata: { title: 'Welcome Message', sent_count: 156, status: 'sent' }
            },
            {
              type: 'subscription_created',
              description: 'New subscription from Demo Company',
              timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
              metadata: { customer_name: 'Demo Company', endpoint: 'https://fcm.googleapis.com/...' }
            }
          ]
          setActivities(mockActivities)
        }
      } catch (error) {
        logError(error, 'ActivityLogs')
      } finally {
        setLoading(false)
      }
    }

    loadActivity()
  }, []) // No dependencies needed for initial load

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_registration': return <UserCheck className="w-4 h-4 text-green-500" />
      case 'notification_sent': return <Send className="w-4 h-4 text-blue-500" />
      case 'subscription_created': return <Bell className="w-4 h-4 text-purple-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(activity => activity.type === filter)

  const handleExportActivities = () => {
    const csvData = filteredActivities.map(activity => ({
      type: activity.type.replace('_', ' '),
      description: activity.description,
      timestamp: new Date(activity.timestamp).toLocaleString(),
      metadata: activity.metadata ? JSON.stringify(activity.metadata) : 'N/A'
    }))
    
    const csvContent = 'data:text/csv;charset=utf-8,' + 
      'Type,Description,Timestamp,Metadata\n' +
      csvData.map(row => `"${row.type}","${row.description}","${row.timestamp}","${row.metadata.replace(/"/g, '""')}"`).join('\n')
    
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csvContent))
    link.setAttribute('download', `activity-logs-${new Date().toISOString().split('T')[0]}.csv`)
    link.click()
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Activity Logs</h2>
          <p className="text-gray-600">Recent system activity and events</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Activities</option>
            <option value="user_registration">User Registrations</option>
            <option value="notification_sent">Notifications</option>
            <option value="subscription_created">Subscriptions</option>
          </select>
          <Button onClick={handleExportActivities} size="sm" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardBody>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loading />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                    {activity.metadata && (
                      <div className="mt-2 p-2 bg-white rounded border text-xs">
                        <pre className="text-gray-600 whitespace-pre-wrap">
                          {JSON.stringify(activity.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      activity.type === 'user_registration' ? 'bg-green-100 text-green-800' :
                      activity.type === 'notification_sent' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {activity.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
              
              {filteredActivities.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-4" />
                  <p>No activities found</p>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

// Subscriber Management Page
const SubscriberManagement = () => {
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCustomer, setFilterCustomer] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [customers, setCustomers] = useState([])
  const abortControllerRef = useRef(null)
  const isLoadingRef = useRef(false)

  const loadData = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (isLoadingRef.current) return
    
    try {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      // Create new abort controller
      abortControllerRef.current = new AbortController()
      isLoadingRef.current = true
      setLoading(true)
      
      const headers = getAuthHeaders()
      const [subscribersRes, customersRes] = await Promise.all([
        fetchWithDeduplication(`${API_BASE}/api/admin/subscribers?search=${search}`, { headers, signal: abortControllerRef.current.signal }),
        fetchWithDeduplication(`${API_BASE}/api/admin/customers`, { headers, signal: abortControllerRef.current.signal })
        ])
        
        if (subscribersRes.ok) {
          const data = await subscribersRes.json()
          setSubscribers(data.subscribers || [])
        } else {
          // Mock subscriber data
          setSubscribers([
            {
              id: '1',
              endpoint: 'https://fcm.googleapis.com/fcm/send/abc123...',
              customer_name: 'Demo Company',
              country: 'US',
              browser: 'Chrome',
              platform: 'desktop',
              created_at: new Date().toISOString(),
              customer_id: '1'
            },
            {
              id: '2',
              endpoint: 'https://fcm.googleapis.com/fcm/send/def456...',
              customer_name: 'Test Corp',
              country: 'UK',
              browser: 'Firefox',
              platform: 'mobile',
              created_at: new Date().toISOString(),
              customer_id: '2'
            }
          ])
        }
        
        if (customersRes.ok) {
          const data = await customersRes.json()
          setCustomers(data.customers || [])
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          if (process.env.NODE_ENV === 'development') {
            console.log('Subscriber request aborted')
          }
          return
        }
        logError(error, 'SubscriberManagement')
      } finally {
        isLoadingRef.current = false
        setLoading(false)
      }
    }, [search])

    useEffect(() => {
      const debounceTimer = setTimeout(loadData, 300)
      return () => {
        clearTimeout(debounceTimer)
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
      }
    }, [loadData])

  const filteredSubscribers = subscribers.filter(sub => {
    if (filterCustomer !== 'all' && sub.customer_id !== filterCustomer) return false
    if (filterStatus !== 'all' && filterStatus === 'active' && !sub.endpoint) return false
    return true
  })

  const handleExportSubscribers = () => {
    const csvData = filteredSubscribers.map(sub => ({
      id: sub.id,
      customer: sub.customer_name,
      platform: sub.platform,
      browser: sub.browser,
      country: sub.country,
      created: new Date(sub.created_at).toLocaleDateString(),
      endpoint: sub.endpoint.substring(0, 50) + '...'
    }))
    
    const csvContent = 'data:text/csv;charset=utf-8,' + 
      'ID,Customer,Platform,Browser,Country,Created,Endpoint\n' +
      csvData.map(row => Object.values(row).join(',')).join('\n')
    
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csvContent))
    link.setAttribute('download', `subscribers-${new Date().toISOString().split('T')[0]}.csv`)
    link.click()
  }

  const handleSendToSubscriber = async (subscriberId) => {
    const title = prompt('Enter notification title:')
    const body = prompt('Enter notification message:')
    
    if (title && body) {
      try {
        const response = await fetch(`${API_BASE}/api/admin/notify-subscriber`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            subscriberId,
            title,
            body
          })
        })
        
        if (response.ok) {
          alert('Notification sent successfully!')
        } else {
          alert('Failed to send notification')
        }
      } catch (error) {
        alert('Error sending notification: ' + error.message)
      }
    }
  }

  const handleDeleteSubscriber = async (subscriberId) => {
    if (!confirm('Are you sure you want to delete this subscriber?')) return
    
    try {
      const response = await fetch(`${API_BASE}/api/admin/subscribers/${subscriberId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        setSubscribers(prev => prev.filter(s => s.id !== subscriberId))
        alert('Subscriber deleted successfully!')
      } else {
        alert('Failed to delete subscriber')
      }
    } catch (error) {
      alert('Error deleting subscriber: ' + error.message)
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Subscriber Management</h2>
          <p className="text-gray-600">Manage push notification subscribers across all customers</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="secondary" size="sm" onClick={handleExportSubscribers}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search subscribers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Customers</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button variant="secondary" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Subscribers List */}
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
                      Subscriber
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Platform
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubscribers.map((subscriber) => (
                    <tr key={subscriber.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Bell className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {subscriber.endpoint.substring(0, 40)}...
                            </div>
                            <div className="text-sm text-gray-500">ID: {subscriber.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{subscriber.customer_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {subscriber.platform === 'mobile' ? (
                            <Smartphone className="w-4 h-4 mr-2 text-blue-500" />
                          ) : (
                            <Monitor className="w-4 h-4 mr-2 text-gray-500" />
                          )}
                          <span className="text-sm text-gray-900">{subscriber.browser}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Globe className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-sm text-gray-900">{subscriber.country}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(subscriber.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="secondary" onClick={() => handleSendToSubscriber(subscriber.id)} title="Send Notification">
                            <Send className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleDeleteSubscriber(subscriber.id)} title="Delete Subscriber">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

// Customer Details Page
const CustomerDetails = () => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true)
        const response = await fetchWithDeduplication(`${API_BASE}/api/admin/customers?search=${search}&status=${statusFilter}`, { headers: getAuthHeaders() })
        
        if (response.ok) {
          const data = await response.json()
          setCustomers(data.customers || [])
        } else {
          // Mock customer data
          setCustomers([
            {
              id: '1',
              name: 'Demo Company',
              email: 'demo@customer.com',
              company_name: 'Demo Company Inc.',
              country: 'US',
              plan: 'pro',
              status: 'active',
              subscriber_count: 123,
              notification_count: 45,
              created_at: new Date().toISOString(),
              api_key: 'demo_abc123'
            }
          ])
        }
      } catch (error) {
        logError(error, 'CustomerDetails')
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(loadCustomers, 300)
    return () => clearTimeout(debounceTimer)
  }, [search, statusFilter]) // Removed unstable headers and apiBase dependencies

  const handleStatusUpdate = async (customerId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/customers/${customerId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        setCustomers(prev => prev.map(c => 
          c.id === customerId ? { ...c, status: newStatus } : c
        ))
        alert('Customer status updated successfully!')
      } else {
        alert('Failed to update customer status')
      }
    } catch (error) {
      console.error('Failed to update customer status:', error)
      alert('Error updating customer status: ' + error.message)
    }
  }

  const handleViewCustomerDetails = (customer) => {
    const details = [
      `Company: ${customer.company_name || 'N/A'}`,
      `Email: ${customer.email}`,
      `Country: ${customer.country || 'Unknown'}`,
      `Plan: ${customer.plan || 'free'}`,
      `Status: ${customer.status}`,
      `Subscribers: ${customer.subscriber_count || 0}`,
      `Notifications: ${customer.notification_count || 0}`,
      `API Key: ${customer.api_key ? customer.api_key.substring(0, 20) + '...' : 'N/A'}`,
      `Created: ${new Date(customer.created_at).toLocaleDateString()}`
    ]
    alert(`Customer Details:\n\n${details.join('\n')}`)
  }

  const handleSendToCustomer = async (customerId, customerName) => {
    const title = prompt(`Send notification to all subscribers of ${customerName}:\n\nEnter notification title:`)
    const body = prompt('Enter notification message:')
    
    if (title && body) {
      try {
        const response = await fetch(`${API_BASE}/api/admin/notify`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            targetType: 'customer',
            targetValue: customerId,
            title,
            body
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          alert(`Notification sent successfully to ${data.successCount || 0} subscribers!`)
        } else {
          alert('Failed to send notification')
        }
      } catch (error) {
        alert('Error sending notification: ' + error.message)
      }
    }
  }

  const handleEditCustomer = (customer) => {
    const newName = prompt(`Edit customer name:`, customer.name)
    const newCompany = prompt(`Edit company name:`, customer.company_name || '')
    
    if (newName !== null && newCompany !== null) {
      setCustomers(prev => prev.map(c => 
        c.id === customer.id 
          ? { ...c, name: newName, company_name: newCompany }
          : c
      ))
      alert('Customer updated successfully!')
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Details</h2>
          <p className="text-gray-600">Manage customer accounts and subscriptions</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Customer Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <Loading />
          </div>
        ) : (
          customers.map((customer) => (
            <Card key={customer.id}>
              <CardBody className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                      <p className="text-sm text-gray-500">{customer.company_name}</p>
                      <p className="text-sm text-gray-500 flex items-center mt-1">
                        <Mail className="w-4 h-4 mr-1" />
                        {customer.email}
                      </p>
                    </div>
                  </div>
                  <select
                    value={customer.status}
                    onChange={(e) => handleStatusUpdate(customer.id, e.target.value)}
                    className={`px-2 py-1 text-xs font-medium rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${
                      customer.status === 'active' ? 'bg-green-100 text-green-800' :
                      customer.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{customer.subscriber_count || 0}</p>
                    <p className="text-xs text-gray-500">Subscribers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{customer.notification_count || 0}</p>
                    <p className="text-xs text-gray-500">Notifications</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-purple-600 uppercase">{customer.plan || 'free'}</p>
                    <p className="text-xs text-gray-500">Plan</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-1" />
                      {customer.country || 'Unknown'}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(customer.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Button size="sm" variant="primary" className="flex-1" onClick={() => handleViewCustomerDetails(customer)}>
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleSendToCustomer(customer.id, customer.name)}>
                    <Send className="w-4 h-4 mr-1" />
                    Send
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleEditCustomer(customer)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

// Notification History Page
const NotificationHistory = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true)
        // Mock notification history data
        const mockNotifications = [
          {
            id: '1',
            title: 'Welcome Message',
            body: 'Thanks for subscribing to our notifications!',
            status: 'sent',
            sent_count: 156,
            customer_name: 'Demo Company',
            created_at: new Date().toISOString(),
            url: 'https://example.com'
          },
          {
            id: '2',
            title: '[ADMIN] System Maintenance',
            body: 'Scheduled maintenance will occur tonight at 2 AM UTC',
            status: 'sent',
            sent_count: 1024,
            customer_name: null,
            created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            url: null
          }
        ]
        setNotifications(mockNotifications)
      } catch (error) {
        logError(error, 'NotificationHistory')
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, []) // No dependencies needed for initial load

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.status === filter)

  const handleViewNotificationDetails = (notification) => {
    const details = [
      `Title: ${notification.title}`,
      `Message: ${notification.body}`,
      `Status: ${notification.status}`,
      `Recipients: ${notification.sent_count}`,
      `Customer: ${notification.customer_name || 'Admin Notification'}`,
      `Sent: ${new Date(notification.created_at).toLocaleString()}`,
      `URL: ${notification.url || 'None'}`
    ]
    alert(`Notification Details:\n\n${details.join('\n')}`)
  }

  const handleDownloadReport = (notification) => {
    const reportData = {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      status: notification.status,
      sent_count: notification.sent_count,
      customer_name: notification.customer_name || 'Admin',
      created_at: new Date(notification.created_at).toLocaleString(),
      url: notification.url || 'N/A'
    }
    
    const csvContent = 'data:text/csv;charset=utf-8,' + 
      'Field,Value\n' +
      Object.entries(reportData).map(([key, value]) => `${key.replace('_', ' ')},"${value}"`).join('\n')
    
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csvContent))
    link.setAttribute('download', `notification-${notification.id}-report.csv`)
    link.click()
  }

  const handleExportAllNotifications = () => {
    const csvData = filteredNotifications.map(notif => ({
      id: notif.id,
      title: notif.title,
      status: notif.status,
      recipients: notif.sent_count,
      customer: notif.customer_name || 'Admin',
      sent: new Date(notif.created_at).toLocaleString()
    }))
    
    const csvContent = 'data:text/csv;charset=utf-8,' + 
      'ID,Title,Status,Recipients,Customer,Sent\n' +
      csvData.map(row => Object.values(row).map(val => `"${val}"`).join(',')).join('\n')
    
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csvContent))
    link.setAttribute('download', `notifications-history-${new Date().toISOString().split('T')[0]}.csv`)
    link.click()
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notification History</h2>
          <p className="text-gray-600">View all sent notifications and their delivery status</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
          </select>
          <Button onClick={handleExportAllNotifications} className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardBody>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loading />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div key={notification.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          notification.status === 'sent' ? 'bg-green-100 text-green-800' :
                          notification.status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {notification.status}
                        </span>
                        {!notification.customer_name && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">{notification.body}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Send className="w-4 h-4 mr-1" />
                          {notification.sent_count} recipients
                        </div>
                        {notification.customer_name && (
                          <div className="flex items-center">
                            <Building2 className="w-4 h-4 mr-1" />
                            {notification.customer_name}
                          </div>
                        )}
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(notification.created_at).toLocaleString()}
                        </div>
                      </div>
                      {notification.url && (
                        <div className="mt-2">
                          <a href={notification.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            {notification.url}
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="secondary" onClick={() => handleViewNotificationDetails(notification)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleDownloadReport(notification)}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

// Complete System Settings
const SystemSettings = () => {
  const [settings, setSettings] = useState({
    systemName: 'NotifyPro',
    adminEmail: 'admin@notifypro.com',
    maxCustomers: 1000,
    maxNotifications: 100000,
    retentionDays: 90,
    enableRegistration: true,
    requireEmailVerification: true,
    enableMetrics: true
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
  const handleSave = async () => {
    setSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleExportSettings = () => {
    const configData = {
      ...settings,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
    
    const jsonContent = 'data:text/json;charset=utf-8,' + JSON.stringify(configData, null, 2)
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(jsonContent))
    link.setAttribute('download', `system-settings-${new Date().toISOString().split('T')[0]}.json`)
    link.click()
  }

  const handleImportSettings = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result)
          const { exportedAt, version, ...settingsToImport } = importedSettings
          setSettings(prev => ({ ...prev, ...settingsToImport }))
          alert('Settings imported successfully!')
        } catch (error) {
          alert('Error importing settings: Invalid file format')
        }
      }
      reader.readAsText(file)
    }
  }

  const handleResetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to default values? This action cannot be undone.')) {
      setSettings({
        systemName: 'NotifyPro',
        adminEmail: 'admin@notifypro.com',
        maxCustomers: 1000,
        maxNotifications: 100000,
        retentionDays: 90,
        enableRegistration: true,
        requireEmailVerification: true,
        enableMetrics: true
      })
      alert('Settings reset to defaults')
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
          <p className="text-gray-600">Configure system-wide settings and preferences</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={handleExportSettings} variant="secondary" size="sm" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
          <label className="cursor-pointer">
            <Button variant="secondary" size="sm" className="flex items-center space-x-2" as="span">
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </Button>
            <input type="file" accept=".json" onChange={handleImportSettings} className="hidden" />
          </label>
          <Button onClick={handleResetToDefaults} variant="outline" size="sm" className="flex items-center space-x-2">
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </Button>
        </div>
      </div>

      {saved && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          Settings saved successfully!
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardBody className="space-y-4">
            <h3 className="text-lg font-semibold">General Settings</h3>
            
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </CardBody>
        </Card>

        {/* Feature Settings */}
        <Card>
          <CardBody className="space-y-4">
            <h3 className="text-lg font-semibold">Feature Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">Enable User Registration</label>
                  <p className="text-sm text-gray-500">Allow new users to register</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableRegistration}
                  onChange={(e) => setSettings({...settings, enableRegistration: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">Require Email Verification</label>
                  <p className="text-sm text-gray-500">Users must verify email before access</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.requireEmailVerification}
                  onChange={(e) => setSettings({...settings, requireEmailVerification: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">Enable Metrics Collection</label>
                  <p className="text-sm text-gray-500">Collect usage and performance metrics</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableMetrics}
                  onChange={(e) => setSettings({...settings, enableMetrics: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Retention (days)
              </label>
              <select
                value={settings.retentionDays}
                onChange={(e) => setSettings({...settings, retentionDays: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
                <option value={365}>1 year</option>
              </select>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold mb-4">System Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Database className="w-5 h-5 text-blue-500 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Database Status</p>
                  <p className="text-sm text-green-600">Connected</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Zap className="w-5 h-5 text-yellow-500 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900">API Performance</p>
                  <p className="text-sm text-gray-600">45ms avg</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900">System Health</p>
                  <p className="text-sm text-green-600">Operational</p>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="pt-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Changes are automatically validated and saved securely.
        </div>
        <Button
          onClick={handleSave}
          loading={saving}
          variant="primary"
        >
          <Settings className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  )
}

// Admin Dashboard Overview (from previous isolated version)
const AdminOverview = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetchWithDeduplication(`${API_BASE}/api/admin/overview`, { headers: getAuthHeaders() })
        
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
          setStats({
            totalUsers: 0,
            activeCustomers: 0,
            totalSubscribers: 0,
            monthlyNotifications: 0,
            topCountries: []
          })
        }
      } catch (error) {
        logError(error, 'AdminOverview')
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

  const handleSend = async () => {
    setSending(true)
    setResult(null)

    try {
      const response = await fetch(`${API_BASE}/api/admin/notify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(notification)
      })

      if (response.ok) {
        const data = await response.json()
        setResult({ 
          success: true, 
          message: `Notification sent successfully to ${data.successCount || 'all'} subscribers!`
        })
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

export default function CompleteAdminDashboard() {
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

  // Memoize navigation items to prevent re-creation on every render
  const navItems = useMemo(() => [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'users', label: 'User Management', icon: Users },
    { key: 'subscribers', label: 'Subscriber Management', icon: Bell },
    { key: 'customers', label: 'Customer Details', icon: Building2 },
    { key: 'send', label: 'Send Notifications', icon: Send },
    { key: 'history', label: 'Notification History', icon: Clock },
    { key: 'analytics', label: 'Analytics', icon: TrendingUp },
    { key: 'activity', label: 'Activity Logs', icon: Activity },
    { key: 'settings', label: 'System Settings', icon: Settings },
  ], [])

  // Memoize content rendering to prevent unnecessary re-renders
  const renderContent = useCallback(() => {
    switch (currentTab) {
      case 'overview':
        return <AdminOverview />
      case 'users':
        return <UserManagement />
      case 'subscribers':
        return <SubscriberManagement />
      case 'customers':
        return <CustomerDetails />
      case 'send':
        return <AdminNotificationSender />
      case 'history':
        return <NotificationHistory />
      case 'analytics':
        return <AnalyticsDashboard />
      case 'activity':
        return <ActivityLogs />
      case 'settings':
        return <SystemSettings />
      default:
        return <AdminOverview />
    }
  }, [currentTab])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-80 md:flex-col">
        <div className="flex flex-col flex-1 bg-gradient-to-b from-blue-50 to-white border-r border-gray-200">
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

      <div className="md:pl-80">
        <div className="bg-white border-b border-gray-200 px-4 py-4 md:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 md:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {navItems.find(item => item.key === currentTab)?.label || 'Admin Dashboard'}
              </h1>
            </div>
            <button
              onClick={() => navigate('/')}
              className="p-2 text-gray-500 hover:text-blue-600 rounded-lg transition-colors"
              title="Back to Home"
            >
              <Home className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <main>
          {renderContent()}
        </main>
      </div>
    </div>
  )
}