import { useOutletContext, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Card, CardBody, Alert } from '../../components/ui'

export default function SettingsPage() {
  const { me, apiBase } = useOutletContext()
  const [showApiKey, setShowApiKey] = useState(false)
  const [copySuccess, setCopySuccess] = useState('')
  const navigate = useNavigate()

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
          <h3 className="text-lg font-semibold mb-4">API Integration</h3>
          <div className="space-y-4">
            {/* API Key Section */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">🔑 Customer API Key</h4>
                  <p className="text-xs text-gray-600">Use this key for frontend integration and testing</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                  >
                    {showApiKey ? '🙈 Hide' : '👁️ Show'}
                  </button>
                  <button
                    onClick={() => copyToClipboard(me.customer?.api_key, 'API Key')}
                    className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
              
              <code className="block text-xs bg-gray-50 p-2 rounded border break-all">
                {showApiKey ? (me.customer?.api_key || 'Not available') : formatKey(me.customer?.api_key)}
              </code>
            </div>

            {/* Push Configuration */}
            <div className="border rounded-lg p-4 bg-green-50 border-green-200">
              <div className="flex items-center justify-between mb-2">
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
                <div><button onClick={() => navigate('/app/documentation')} className="text-blue-600 hover:underline">→ View Documentation</button></div>
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