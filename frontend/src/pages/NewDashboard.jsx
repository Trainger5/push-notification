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
  const apiBaseRaw = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || 'http://13.126.228.42'
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
                    <div>→ Create <code>/pn-sw.js</code> file at your website root</div>
                    <div>→ Add SDK script with <code>data-api-key</code> attribute</div>
                    <div>→ Call <code>PN.init()</code> to initialize push notifications</div>
                    <div className="text-xs text-green-600">✅ Fully tested and working - see integration code below!</div>
                  </div>
                </CardBody>
              </Card>
            </div>

            <Card>
              <CardBody>
                <h3 className="text-lg font-semibold mb-4">🚀 Quick Integration - ONE Line!</h3>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 p-4 rounded-lg mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="text-2xl">✨</div>
                    <span className="text-lg font-semibold text-purple-700">Simplest Option: Just ONE Line of Code!</span>
                  </div>
                  <p className="text-sm text-purple-600 mb-3">Add this single line to your website and you're done:</p>
                  <div className="bg-white p-3 rounded border border-purple-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-600">One-Line Integration</span>
                      <button 
                        className="text-xs text-purple-600 hover:underline font-semibold"
                        onClick={() => {
                          const code = `<script src="https://pushads123.com/instant-push.js" data-api-key="${me?.customer?.api_key || 'YOUR_API_KEY'}" data-auto-init></script>`;
                          navigator.clipboard.writeText(code).then(() => {
                            alert('One-line code copied! Just paste it in your HTML.');
                          });
                        }}
                      >
                        📋 Copy One-Line Code
                      </button>
                    </div>
                    <pre className="text-xs bg-purple-50 p-2 rounded border overflow-x-auto">
{`<script src="https://pushads123.com/instant-push.js" data-api-key="${me?.customer?.api_key || 'YOUR_API_KEY'}" data-auto-init></script>`}
                    </pre>
                  </div>
                  <p className="text-xs text-purple-600 mt-2">This automatically creates a beautiful notification button and handles everything!</p>
                </div>

                <h3 className="text-lg font-semibold mb-4">Standard Integration (More Control)</h3>
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-700 font-medium">✅ Full control over implementation</span>
                  </div>
                  <p className="text-sm text-green-600">Use this approach if you want more control over the integration:</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">Step 1: Create Service Worker File</h4>
                    <p className="text-sm text-gray-600 mb-3">Create a file called <code className="bg-gray-100 px-1 rounded">/pn-sw.js</code> at your website root (same folder as index.html):</p>
                    <div className="bg-gray-50 p-3 rounded border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-600">File: /pn-sw.js</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = 'https://pushads123.com/download/pn-sw.js';
                              link.download = 'pn-sw.js';
                              link.click();
                            }}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            📥 Download
                          </button>
                          <button 
                            onClick={() => {
                              const code = `importScripts('https://pushads123.com/pn-sw.js');`;
                              navigator.clipboard.writeText(code).then(() => {
                                alert('Code copied to clipboard!');
                              });
                            }}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            📋 Copy Code
                          </button>
                        </div>
                      </div>
                      <pre className="text-xs bg-white p-2 rounded border">
{`importScripts('https://pushads123.com/pn-sw.js');`}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Step 2: Initialize SDK (No Auto-Permission)</h4>
                    <p className="text-sm text-gray-600 mb-3">Add the SDK to your HTML. This only loads the SDK, it does NOT request permission:</p>
                    <div className="bg-gray-50 p-3 rounded border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-600">Add to your HTML file</span>
                        <button 
                          className="text-xs text-blue-600 hover:underline"
                          onClick={() => {
                            const htmlCode = document.getElementById('html-integration-code').textContent;
                            navigator.clipboard.writeText(htmlCode).then(() => {
                              alert('HTML code copied to clipboard!');
                            }).catch(() => {
                              alert('Failed to copy. Please select and copy manually.');
                            });
                          }}
                        >
                          📋 Copy HTML
                        </button>
                      </div>
                      <pre id="html-integration-code" className="text-xs bg-white p-2 rounded border overflow-x-auto">
{`<script src="https://pushads123.com/sdk.js" data-api-key="${me?.customer?.api_key || 'pn_YOUR_API_KEY_HERE'}"></script>
<script>
  PN.init({ 
    baseUrl: 'https://pushads123.com', 
    serviceWorkerUrl: '/pn-sw.js' 
  });
</script>`}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Step 3: Add Subscribe Button (User Click Required!)</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      <span className="text-red-600 font-semibold">⚠️ Important:</span> Browsers require user interaction to enable notifications. Add a button:
                    </p>
                    
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Why a button?</strong> Browsers block auto-subscription to prevent spam. Permission MUST be triggered by user click.
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Simple Button Example */}
                      <div className="bg-gray-50 p-3 rounded border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-600 font-semibold">Option A: Simple Button</span>
                          <button 
                            onClick={() => {
                              const code = `<button id="enablePush">🔔 Enable Notifications</button>

<script>
document.getElementById("enablePush").addEventListener("click", async () => {
  try {
    const result = await PN.subscribe();
    if (result.success) {
      document.getElementById("enablePush").innerHTML = "✅ Notifications Enabled";
      document.getElementById("enablePush").disabled = true;
    }
  } catch (error) {
    alert("Failed: " + error.message);
  }
});
</script>`;
                              navigator.clipboard.writeText(code).then(() => {
                                alert('Button code copied!');
                              });
                            }}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            📋 Copy Code
                          </button>
                        </div>
                        <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
{`<button id="enablePush">🔔 Enable Notifications</button>

<script>
document.getElementById("enablePush").addEventListener("click", async () => {
  try {
    // This requests permission when user clicks!
    const result = await PN.subscribe();
    if (result.success) {
      document.getElementById("enablePush").innerHTML = "✅ Enabled";
      document.getElementById("enablePush").disabled = true;
    }
  } catch (error) {
    alert("Failed: " + error.message);
  }
});
</script>`}
                        </pre>
                      </div>
                      
                      {/* Styled Button Example */}
                      <div className="bg-gray-50 p-3 rounded border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-600 font-semibold">Option B: Beautiful Styled Button</span>
                          <button 
                            onClick={() => {
                              const code = `<style>
  .push-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
  }
  .push-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
  }
  .push-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>

<button id="notifyBtn" class="push-btn">
  🔔 Enable Push Notifications
</button>

<script>
document.getElementById("notifyBtn").addEventListener("click", async () => {
  const btn = document.getElementById("notifyBtn");
  btn.innerHTML = "⏳ Enabling...";
  btn.disabled = true;
  
  try {
    const result = await PN.subscribe();
    if (result.success) {
      btn.innerHTML = "✅ Notifications Active";
      btn.style.background = "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)";
    }
  } catch (error) {
    btn.innerHTML = "❌ Failed - Try Again";
    btn.disabled = false;
  }
});
</script>`;
                              navigator.clipboard.writeText(code).then(() => {
                                alert('Styled button code copied!');
                              });
                            }}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            📋 Copy Styled Code
                          </button>
                        </div>
                        <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
{`<style>
  .push-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
  }
  .push-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102,126,234,0.4);
  }
</style>

<button id="notifyBtn" class="push-btn">
  🔔 Enable Push Notifications
</button>

<script>
document.getElementById("notifyBtn").addEventListener("click", async () => {
  const btn = document.getElementById("notifyBtn");
  btn.innerHTML = "⏳ Enabling...";
  btn.disabled = true;
  
  try {
    const result = await PN.subscribe();
    if (result.success) {
      btn.innerHTML = "✅ Active";
      btn.style.background = "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)";
    }
  } catch (error) {
    btn.innerHTML = "❌ Try Again";
    btn.disabled = false;
  }
});
</script>`}
                        </pre>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">🧪 Test Your Integration</h4>
                    <p className="text-sm text-blue-700 mb-3">Use our test page to verify everything works:</p>
                    <a 
                      href="/api-key-test.html" 
                      target="_blank"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      🔬 Open Integration Test
                    </a>
                    <p className="text-xs text-blue-600 mt-2">This will test your API key and full integration flow step by step.</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <h3 className="text-lg font-semibold mb-4">What This Code Does</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <div>
                      <strong>Loads the SDK</strong> - Downloads and initializes the push notification system
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <div>
                      <strong>Registers Service Worker</strong> - Sets up background push handling using your /pn-sw.js file
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <div>
                      <strong>User Clicks Button</strong> - Permission is requested ONLY when user clicks the button
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">4</div>
                    <div>
                      <strong>Creates Subscription</strong> - Generates push endpoint and saves it to your dashboard
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">5</div>
                    <div>
                      <strong>Ready to Send</strong> - You can now send notifications from this dashboard!
                    </div>
                  </div>
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
