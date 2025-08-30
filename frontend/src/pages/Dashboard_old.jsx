import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, CardBody, CardHeader, Input, Loading, Badge, Alert } from '../components/ui'
import { Settings, Users, BarChart3, Send, Layout, Webhook, Calendar, Layers, TestTube2, FileText } from 'lucide-react'
import { 
  DashboardOverview,
  AnalyticsDashboard,
  NotificationScheduler,
  UserSegments,
  WebhookManagement,
  SubscriberManagement,
  SendNotification,
  CampaignBuilder,
  NotificationTemplates,
  ABTesting,
  SettingsPage
} from '../components/temp/DashboardComponents.jsx'

function useAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

function useApiBase() {
  const apiBaseRaw = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:4000'
  return apiBaseRaw.toString().replace(/\/?$/, '')
}

export default function Dashboard() {
  const [me, setMe] = useState(null)
  const [currentTab, setCurrentTab] = useState('overview')
  const [stats, setStats] = useState({ subscribers: 0 })
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(false)
  const [isLoadingRef] = useState({ current: false })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const headers = useAuthHeaders()
  const apiBase = useApiBase()
  const navigate = useNavigate()

  async function load(retryCount = 0) {
    // Prevent concurrent API calls
    if (isLoadingRef.current) {
      return
    }
    isLoadingRef.current = true
    try {
      setLoading(true)
      const r = await fetch(`${apiBase}/api/customer/me`, { headers })
      if (!r.ok) {
        if (r.status === 401 || r.status === 403) {
          setAuthError(true)
          return
        }
        if (r.status === 429) {
          // Limit retries to prevent infinite loop
          if (retryCount < 3) {
            console.warn(`Rate limited, retrying in ${2 + retryCount} seconds... (attempt ${retryCount + 1}/3)`)
            isLoadingRef.current = false
            setTimeout(() => load(retryCount + 1), (2 + retryCount) * 1000)
            return
          } else {
            console.error('Rate limit exceeded after 3 retries, showing auth error')
            setAuthError(true)
            return
          }
        }
        let errorMessage = 'Unknown error'
        try {
          const errorData = await r.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = `HTTP ${r.status}: ${r.statusText}`
        }
        throw new Error(errorMessage)
      }
      const data = await r.json()
      setMe(data)
      setStats({ subscribers: data.subscriberCount || 0 })
      setAuthError(false)
    } catch (error) {
      console.error('Dashboard load error:', error)
      setAuthError(true)
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }

  useEffect(() => { 
    if (!isLoadingRef.current) {
      load() 
    }
    return () => {
      // Cleanup to prevent multiple instances
      isLoadingRef.current = false
    }
  }, [])

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Layout },
    { id: 'send', label: 'Send Notification', icon: Send },
    { id: 'campaigns', label: 'Campaigns', icon: FileText },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'subscribers', label: 'Subscribers', icon: Users },
    { id: 'scheduler', label: 'Scheduler', icon: Calendar },
    { id: 'segments', label: 'Segments', icon: Layers },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook },
    { id: 'abtesting', label: 'A/B Testing', icon: TestTube2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]


  const renderContent = () => {
    switch (currentTab) {
      case 'overview':
        return <DashboardOverview />
      case 'send':
        return <SendNotification />
      case 'campaigns':
        return <CampaignBuilder />
      case 'templates':
        return <NotificationTemplates />
      case 'analytics':
        return <AnalyticsDashboard />
      case 'subscribers':
        return <SubscriberManagement />
      case 'scheduler':
        return <NotificationScheduler />
      case 'segments':
        return <UserSegments />
      case 'webhooks':
        return <WebhookManagement />
      case 'abtesting':
        return <ABTesting />
      case 'settings':
        return <SettingsPage />
      default:
        return <DashboardOverview />
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div>
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading your dashboard...</div>
        </div>
      </div>
    )
  }

  // Show authentication error with login options
  if (authError || !me) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardBody className="text-center py-12">
            <div className="mb-6">
              <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🔒</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Authentication Required</h1>
              <p className="text-gray-600">
                Please log in to access the professional dashboard
              </p>
            </div>
            <div className="space-y-3">
              <Button 
                variant="primary" 
                className="w-full"
                onClick={() => navigate('/')}
              >
                Go to Login Page
              </Button>
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => window.location.href = '/'}
              >
                Back to Home
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              Need an account? Contact your administrator or sign up through the main page.
            </p>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className={`dashboard-container`}>
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <Send className="w-4 h-4" />
            </div>
            {sidebarOpen && (
              <div className="sidebar-brand-text">
                <div>NotifyPro</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Professional Dashboard</div>
              </div>
            )}
          </div>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`sidebar-item ${currentTab === item.id ? 'active' : ''}`}
              >
                <Icon className="sidebar-item-icon" />
                {sidebarOpen && <span className="sidebar-item-text">{item.label}</span>}
              </button>
            )
          })}
        </nav>
        
        <div className="absolute bottom-4 left-4 right-4">
          {sidebarOpen && me?.customer && (
            <div className="bg-gray-100 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900">{me.customer.name}</p>
              <p className="text-xs text-gray-500">{stats.subscribers} subscribers</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={`main-content ${sidebarOpen ? '' : 'main-content-collapsed'}`}>
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="btn btn-secondary"
              style={{ marginRight: '1rem' }}
            >
              <Layout className="sidebar-item-icon" />
            </button>
            <div>
              <h1 className="header-title">
                {menuItems.find(item => item.id === currentTab)?.label || 'Dashboard'}
              </h1>
            </div>
          </div>
          <div className="header-right">
            <div className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
              {stats.subscribers} subscribers
            </div>
            <Button 
              variant="secondary"
              onClick={() => {
                localStorage.removeItem('token')
                localStorage.removeItem('role')
                navigate('/')
              }}
            >
              Logout
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <main className="content-area">
          <div className="fade-in">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}