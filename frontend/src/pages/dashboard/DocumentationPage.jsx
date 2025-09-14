import { useOutletContext, useNavigate } from 'react-router-dom'
import { Card, CardBody, Alert } from '../../components/ui'
import { ExternalLink, Check, Copy } from 'lucide-react'
import { useState } from 'react'

export default function DocumentationPage() {
  const { me, apiBase } = useOutletContext()
  const navigate = useNavigate()
  const [toasts, setToasts] = useState([])
  
  // Get CDN base URL from environment
  const cdnBase = import.meta.env.VITE_CDN_BASE || 'https://pushads123.com'

  // Toast notification system
  const showToast = (message, type = 'success') => {
    const id = Date.now()
    const toast = { id, message, type }
    setToasts(prev => [...prev, toast])
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  const copyToClipboard = async (text, successMessage) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast(successMessage)
    } catch (err) {
      showToast('Failed to copy. Please select and copy manually.', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Documentation</h2>
        <p className="text-gray-600 mb-6">Complete guide for integrating push notifications</p>
      </div>
      
      <Alert className="bg-green-50 border-green-200 text-green-800">
        🎉 Your API key and VAPID keys are ready! Find them in <button onClick={() => navigate('/app/settings')} className="font-semibold underline">Settings</button>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
              Get Your Credentials
            </h3>
            <div className="space-y-3 text-sm">
              <div>→ Go to <button onClick={() => navigate('/app/settings')} className="text-blue-600 hover:underline font-medium">Settings</button></div>
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
                  className="text-xs text-purple-600 hover:underline font-semibold flex items-center gap-1"
                  onClick={() => {
                    const code = `<script src="${cdnBase}/instant-push.js" data-api-key="${me?.customer?.api_key || 'YOUR_API_KEY'}" data-auto-init></script>`;
                    copyToClipboard(code, '✨ One-line code copied! Just paste it in your HTML.');
                  }}
                >
                  <Copy className="w-3 h-3" />
                  Copy One-Line Code
                </button>
              </div>
              <pre className="text-xs bg-purple-50 p-2 rounded border overflow-x-auto">
{`<script src="${cdnBase}/instant-push.js" data-api-key="${me?.customer?.api_key || 'YOUR_API_KEY'}" data-auto-init></script>`}
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
                        link.href = `${cdnBase}/download/pn-sw.js`;
                        link.download = 'pn-sw.js';
                        link.click();
                        showToast('📥 Service worker file download started!');
                      }}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Download
                    </button>
                    <button 
                      onClick={() => {
                        const code = `importScripts('${cdnBase}/pn-sw.js');`;
                        copyToClipboard(code, '📋 Service worker code copied!');
                      }}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copy Code
                    </button>
                  </div>
                </div>
                <pre className="text-xs bg-white p-2 rounded border">
{`importScripts('${cdnBase}/pn-sw.js');`}
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
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    onClick={() => {
                      const htmlCode = `<script src="${cdnBase}/sdk.js" data-api-key="${me?.customer?.api_key || 'pn_YOUR_API_KEY_HERE'}"></script>
<script>
  PN.init({ 
    baseUrl: '${cdnBase}', 
    serviceWorkerUrl: '/pn-sw.js' 
  });
</script>`;
                      copyToClipboard(htmlCode, '📋 HTML code copied to clipboard!');
                    }}
                  >
                    <Copy className="w-3 h-3" />
                    Copy HTML
                  </button>
                </div>
                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
{`<script src="${cdnBase}/sdk.js" data-api-key="${me?.customer?.api_key || 'pn_YOUR_API_KEY_HERE'}"></script>
<script>
  PN.init({ 
    baseUrl: '${cdnBase}', 
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
                        copyToClipboard(code, '🔔 Simple button code copied!');
                      }}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copy Code
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
                        copyToClipboard(code, '✨ Styled button code copied!');
                      }}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copy Styled Code
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

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out
              ${toast.type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
              }
            `}
            style={{
              animation: 'slideInRight 0.3s ease-out forwards'
            }}
          >
            {toast.type === 'success' ? (
              <Check className="w-4 h-4" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}