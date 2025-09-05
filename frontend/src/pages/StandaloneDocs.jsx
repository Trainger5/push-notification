import { useState, useEffect } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Card, CardBody, CardHeader, Button, Badge, Alert } from '../components/ui'
import { 
  Book, 
  Code, 
  Globe, 
  Key, 
  Send, 
  Shield, 
  Check,
  Copy,
  ExternalLink,
  Zap,
  Server,
  HelpCircle,
  Home,
  User,
  Bell
} from 'lucide-react'
import Layout from '../components/Layout.jsx'

const CodeBlock = ({ children, language = 'javascript' }) => {
  const [copied, setCopied] = useState(false)
  
  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(children)
      } else {
        // Fallback for non-secure contexts or unsupported browsers
        const textArea = document.createElement('textarea')
        textArea.value = children
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="relative bg-gray-50 p-4 rounded-lg my-4">
      <button
        onClick={copyToClipboard}
        className="absolute top-2 right-2 p-2 rounded-md hover:bg-gray-200 transition-colors"
        title="Copy code"
      >
        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
      </button>
      <pre className="text-sm overflow-x-auto whitespace-pre">
        <code>{children}</code>
      </pre>
    </div>
  )
}

const SidebarLink = ({ href, icon: Icon, children, isActive, onClick }) => {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
        isActive 
          ? 'bg-blue-50 text-blue-600' 
          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
      }`}
    >
      <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
      <span>{children}</span>
    </a>
  )
}

export default function StandaloneDocs() {
  const [activeSection, setActiveSection] = useState('getting-started')
  const role = typeof localStorage !== 'undefined' ? localStorage.getItem('role') : null
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
  const [customerData, setCustomerData] = useState(null)

  // Fetch customer data if logged in
  useEffect(() => {
    if (token) {
      fetch('http://localhost:4000/api/customer/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => setCustomerData(data))
      .catch(() => setCustomerData(null))
    }
  }, [token])

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: Book },
    { id: 'api-reference', title: 'API Reference', icon: Code },
    { id: 'sdk-integration', title: 'SDK Integration', icon: Globe },
    { id: 'authentication', title: 'Authentication', icon: Key },
    { id: 'webhooks', title: 'Webhooks', icon: Send },
    { id: 'best-practices', title: 'Best Practices', icon: Shield },
  ]

  return (
    <Layout>
      <div className="max-w-8xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
          {/* Sidebar Navigation */}
          <div className="md:sticky md:top-5">
            <Card>
              <CardBody className="space-y-1">
                <h3 className="font-semibold text-lg mb-4 px-4">Documentation</h3>
                {sections.map((section) => (
                  <SidebarLink
                    key={section.id}
                    href={`#${section.id}`}
                    icon={section.icon}
                    isActive={activeSection === section.id}
                    onClick={(e) => {
                      e.preventDefault()
                      setActiveSection(section.id)
                    }}
                  >
                    {section.title}
                  </SidebarLink>
                ))}
                <div className="border-t border-gray-200 my-4" />
                <SidebarLink href="/" icon={Home} as={RouterLink} to="/">
                  Back to Home
                </SidebarLink>
                {role && (
                  <SidebarLink 
                    href={role === 'admin' ? '/admin-dashboard' : '/app'} 
                    icon={User} 
                    as={RouterLink} 
                    to={role === 'admin' ? '/admin-dashboard' : '/app'}
                  >
                    Dashboard
                  </SidebarLink>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Hero Section */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
                <div className="flex items-center mb-4">
                  <Bell className="w-8 h-8 mr-4" />
                  <h1 className="text-3xl font-bold">Push Notification API Documentation</h1>
                </div>
                <p className="text-lg opacity-90 mb-6">
                  Everything you need to integrate web push notifications into your application
                </p>
                <div className="flex items-center space-x-4">
                  <Badge className="bg-white/20 text-white">v1.0.0</Badge>
                  <Badge className="bg-green-600 text-white">Production Ready</Badge>
                </div>
              </div>
            </Card>

            {/* Getting Started Section */}
            {activeSection === 'getting-started' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center">
                      <Zap className="w-6 h-6 text-blue-500 mr-3" />
                      <h2 className="text-2xl font-bold">Quick Start Guide</h2>
                    </div>
                  </CardHeader>
                  <CardBody className="space-y-6">
                    <Alert>
                      Get your push notifications running in under 5 minutes with our simple integration process.
                    </Alert>

                    <div>
                      <h3 className="text-xl font-semibold mb-4">1. Get Your API Key</h3>
                      <p className="mb-4">Login to your dashboard to get your unique API key and VAPID keys for authentication.</p>
                      <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                        🔑 Your API key and VAPID keys are automatically generated when you register and are available in <strong>Dashboard → Settings</strong>
                      </Alert>
                      <div className="mt-4">
                        <h4 className="text-lg font-medium mb-2">Steps:</h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                          <li>Login to your dashboard</li>
                          <li>Navigate to <strong>Settings</strong> in the sidebar</li>
                          <li>Copy your <strong>API Key</strong> from the API Configuration section</li>
                          <li>Copy your <strong>VAPID Public Key</strong> (needed for browser integration)</li>
                          <li>Your VAPID Private Key is used server-side automatically</li>
                        </ol>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-4">2. Add SDK to Your Website</h3>
                      <p className="mb-4">Add this script to your HTML page (no service worker file needed - it's handled automatically!):</p>
                      <CodeBlock>
{`<!-- Add to your HTML page -->
<script>
  // Configuration - Only API key needed!
  const API_KEY = '${customerData?.customer?.api_key || 'YOUR_API_KEY_HERE'}'; // ${customerData?.customer?.api_key ? '✅ Your actual API key' : 'From Dashboard > Settings'}
  const SERVER_URL = 'http://localhost:4000'; // Your backend server
  
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
        // SDK fetches VAPID keys automatically using API key
        // User permission and subscription handled automatically
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

<!-- ${customerData?.customer?.api_key ? 'Ready to use! Your API key is already included above.' : 'Replace YOUR_API_KEY_HERE with your actual API key from Dashboard > Settings'} -->`}
                      </CodeBlock>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-2">3. Send Notifications via API</h3>
                      <p className="mb-4">Authenticate with JWT (obtained from the login API or dashboard) and call the customer notify endpoint.</p>
                      <h4 className="font-semibold mb-2">3.1 Get a JWT Token</h4>
                      <CodeBlock>
{`// Get JWT token
const loginRes = await fetch('http://localhost:4000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'demo@customer.com', password: 'password123' })
});
const { token } = await loginRes.json();`}
                      </CodeBlock>
                      <h4 className="font-semibold mb-2">3.2 Send a Notification</h4>
                      <CodeBlock>
{`// Send notification using JWT token
const response = await fetch('http://localhost:4000/api/customer/notify', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Hello World!',
    body: 'Your first push notification',
    url: 'https://your-website.com', // Optional click URL
    icon: 'https://your-website.com/icon.png' // Optional icon
  })
});
const result = await response.json();
console.log('Notification sent:', result);`}
                      </CodeBlock>
                      <p className="text-sm text-gray-600">You can also use the Dashboard to send notifications without writing code.</p>
                      {customerData?.customer?.api_key ? (
                        <Alert className="bg-green-50 border-green-200 text-green-800">
                          🎉 <strong>Tip:</strong> Use the Dashboard → Send Notification for zero‑code sending; or authenticate via JWT as shown above for API access.
                        </Alert>
                      ) : (
                        <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                          💡 <strong>That’s all you need!</strong> The SDK automatically handles permission, VAPID keys, SW registration, and subscription management. {token ? '' : 'Login to see personalized examples.'}
                        </Alert>
                      )}
                    </div>
                  </CardBody>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardBody>
                      <Server className="w-8 h-8 text-blue-500 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Server Requirements</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-sm">Node.js 18+</span>
                        </div>
                        <div className="flex items-center">
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-sm">HTTPS in production</span>
                        </div>
                        <div className="flex items-center">
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-sm">VAPID keys (auto-generated)</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody>
                      <Globe className="w-8 h-8 text-green-500 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Browser Support</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-sm">Chrome/Edge 42+</span>
                        </div>
                        <div className="flex items-center">
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-sm">Firefox 44+</span>
                        </div>
                        <div className="flex items-center">
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-sm">Safari 16+</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody>
                      <Shield className="w-8 h-8 text-purple-500 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Security Features</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-sm">JWT Authentication</span>
                        </div>
                        <div className="flex items-center">
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-sm">API Key Protection</span>
                        </div>
                        <div className="flex items-center">
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-sm">VAPID Encryption</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </div>
            )}

            {/* Other sections would be added here with similar structure */}
            {activeSection !== 'getting-started' && (
              <Card>
                <CardBody>
                  <div className="text-center py-12">
                    <Book className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {sections.find(s => s.id === activeSection)?.title} Section
                    </h3>
                    <p className="text-gray-600 mb-6">
                      This section is under development. More comprehensive documentation coming soon!
                    </p>
                    <Button variant="primary">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Contact Support
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
