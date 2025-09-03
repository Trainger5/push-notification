import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, CardBody, Alert, Loading } from '../components/ui'
import SimpleDashboardLayout from '../components/SimpleDashboardLayout'
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
  ABTesting
} from '../components/temp/DashboardComponents.jsx'
import { ExternalLink } from 'lucide-react'

function useAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

function useApiBase() {
  const apiBaseRaw = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:4000'
  return apiBaseRaw.toString().replace(/\/?$/, '')
}

// Settings component for the dashboard
const SettingsPage = ({ me, setCurrentTab }) => {
  const [showApiKey, setShowApiKey] = useState(false)
  const [copySuccess, setCopySuccess] = useState('')
  const apiBase = useApiBase()

  const copyToClipboard = async (text, label) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for non-secure contexts or unsupported browsers
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
      }
      setCopySuccess(`${label} copied!`)
      setTimeout(() => setCopySuccess(''), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
      setCopySuccess('Copy failed - please copy manually')
      setTimeout(() => setCopySuccess(''), 3000)
    }
  }

  const formatKey = (key) => {
    if (!key) return 'Not available'
    return key.length > 20 ? `${key.substring(0, 20)}...` : key
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
        <p className="text-gray-600 mb-6">Manage your account and API integration settings</p>
      </div>
      
      {copySuccess && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          {copySuccess}
        </Alert>
      )}
      
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold mb-4">Account Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Company Name</label>
              <p className="text-gray-900 font-medium">{me.customer?.company_name || me.customer?.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p className="text-gray-900 font-medium">{me.customer?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Plan</label>
              <p className="text-gray-900 font-medium capitalize">{me.customer?.plan || 'Free'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                me.customer?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {me.customer?.status || 'Active'}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>
      
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">API Configuration</h3>
            <Alert className="bg-blue-50 border-blue-200 text-blue-800 text-sm">
              🔗 Use your API key to integrate notifications - all server setup is handled automatically!
            </Alert>
          </div>
          
          <div className="space-y-6">
            {/* API Key Section */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">API Key</h4>
                  <p className="text-xs text-gray-600">Used for server-side API calls</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-xs px-3 py-1"
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <code className="bg-white px-3 py-2 rounded border text-sm font-mono flex-1">
                  {showApiKey ? me.customer?.api_key : formatKey(me.customer?.api_key)}
                </code>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(me.customer?.api_key, 'API Key')}
                  className="px-3 py-2 text-xs"
                >
                  Copy
                </Button>
              </div>
            </div>

            {/* Server Configuration (Internal) */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Push Configuration</h4>
                  <p className="text-xs text-gray-600">Server-side push notification setup</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600 font-medium">Configured</span>
                </div>
              </div>
              
              <div className="text-xs text-gray-600 bg-white p-3 rounded border">
                ✅ VAPID keys are automatically configured<br/>
                ✅ Push service is ready<br/>
                ✅ All server-side setup is complete<br/><br/>
                <strong>You only need your API key for integration!</strong>
              </div>
            </div>

            {/* Integration Links */}
            <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">📚 Integration Resources</h4>
              <div className="space-y-2 text-sm">
                <div><a href="#" onClick={() => setCurrentTab('documentation')} className="text-blue-600 hover:underline">→ View Documentation</a></div>
                <div><span className="text-gray-600">API Base URL: <code className="bg-white px-1 rounded">{apiBase}/api</code></span></div>
                <div><span className="text-gray-600">SDK available for: JavaScript, Node.js, React</span></div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

export default function NewDashboard() {
  const [me, setMe] = useState(null)
  const [currentTab, setCurrentTab] = useState('overview')
  const [stats, setStats] = useState({ subscribers: 0 })
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(false)
  const [isLoadingRef] = useState({ current: false })
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

  const renderContent = () => {
    switch (currentTab) {
      case 'overview':
        return <DashboardOverview setCurrentTab={setCurrentTab} />
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
        return <SettingsPage me={me} setCurrentTab={setCurrentTab} />
      case 'documentation':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Documentation</h2>
              <p className="text-gray-600 mb-6">Complete guide for integrating push notifications</p>
            </div>
            
            <Alert className="bg-green-50 border-green-200 text-green-800">
              🎉 Your API key and VAPID keys are ready! Find them in <button onClick={() => setCurrentTab('settings')} className="font-semibold underline">Settings</button>
            </Alert>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardBody>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
                    Get Your Credentials
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>→ Go to <button onClick={() => setCurrentTab('settings')} className="text-blue-600 hover:underline font-medium">Settings</button></div>
                    <div>→ Copy your <strong>API Key</strong></div>
                    <div>→ Note the <strong>API Base URL</strong>: <code className="bg-gray-100 px-1 rounded">{apiBase}</code></div>
                    <div className="text-xs text-gray-500">✅ VAPID keys handled automatically by server</div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
                    Add to Your Website
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>→ Add SDK script to your HTML</div>
                    <div>→ Initialize with your API key</div>
                    <div>→ SDK handles everything automatically</div>
                    <div className="text-xs text-gray-500">✅ Permission + subscription handled by SDK</div>
                  </div>
                </CardBody>
              </Card>
            </div>

            <Card>
              <CardBody>
                <h3 className="text-lg font-semibold mb-4">Quick Integration Code</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-xs overflow-x-auto">
{`<!-- Add to your HTML page -->
<script>
  const API_KEY = '${me?.customer?.api_key || 'YOUR_API_KEY_FROM_SETTINGS'}'; // ${me?.customer?.api_key ? '✅ Your actual API key' : 'From Settings'}
  const SERVER_URL = '${apiBase}';
  
  // Load and initialize SDK
  function loadNotificationSDK() {
    const script = document.createElement('script');
    script.src = SERVER_URL + '/sdk.js';
    script.onload = () => {
      // Initialize with just your API key
      PN.init({
        apiKey: API_KEY,
        baseUrl: SERVER_URL
      }).then(() => {
        console.log('✅ Push notifications ready!');
        // SDK handles VAPID keys automatically
      }).catch(err => {
        console.error('Failed to initialize:', err);
      });
    };
    document.head.appendChild(script);
  }
  
  // Load on page ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNotificationSDK);
  } else {
    loadNotificationSDK();
  }
</script>

<!-- ${me?.customer?.api_key ? 'Ready to use! Your API key is already included above.' : 'Replace YOUR_API_KEY_FROM_SETTINGS with your actual API key from Settings'} -->
<!-- The SDK handles permission, subscription, and VAPID keys -->`}
                  </pre>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  {me?.customer?.api_key ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600 font-medium">Ready to use! Your API key is included above</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-600">Replace YOUR_API_KEY_FROM_SETTINGS with your actual API key from Settings</span>
                  )}
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={async () => {
                      const code = document.querySelector('pre').textContent;
                      try {
                        if (navigator.clipboard && window.isSecureContext) {
                          await navigator.clipboard.writeText(code)
                        } else {
                          // Fallback for non-secure contexts
                          const textArea = document.createElement('textarea')
                          textArea.value = code
                          textArea.style.position = 'fixed'
                          textArea.style.left = '-999999px'
                          textArea.style.top = '-999999px'
                          document.body.appendChild(textArea)
                          textArea.focus()
                          textArea.select()
                          document.execCommand('copy')
                          textArea.remove()
                        }
                      } catch (err) {
                        console.error('Failed to copy:', err)
                      }
                    }}
                  >
                    Copy Code
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <h3 className="text-lg font-semibold mb-4">External Resources</h3>
                <div className="space-y-3">
                  <div><a href="/docs" target="_blank" className="text-blue-600 hover:underline flex items-center">→ Complete Documentation <ExternalLink className="w-4 h-4 ml-1" /></a></div>
                  <div><a href="/docs#api-reference" target="_blank" className="text-blue-600 hover:underline flex items-center">→ API Reference <ExternalLink className="w-4 h-4 ml-1" /></a></div>
                  <div><a href="/docs#sdk-integration" target="_blank" className="text-blue-600 hover:underline flex items-center">→ Advanced SDK Usage <ExternalLink className="w-4 h-4 ml-1" /></a></div>
                </div>
              </CardBody>
            </Card>
          </div>
        )
      default:
        return <DashboardOverview />
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loading className="mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Show authentication error with login options
  if (authError || !me) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardBody className="text-center py-12">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🔒</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Authentication Required</h1>
              <p className="text-gray-600">
                Please log in to access the dashboard
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
    <SimpleDashboardLayout 
      currentTab={currentTab}
      setCurrentTab={setCurrentTab}
      user={me}
      stats={stats}
    >
      {renderContent()}
    </SimpleDashboardLayout>
  )
}