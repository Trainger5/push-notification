import { Link as RouterLink } from 'react-router-dom'
import '../styles/notifypro.css'

export default function Docs() {
  const role = typeof localStorage !== 'undefined' ? localStorage.getItem('role') : null
  return (
    <div className="np-page">
      <div className="np-gradient-bg" />
      <div className="np-glass-overlay" />
      <nav className="np-nav">
        <div className="np-nav-inner">
          <RouterLink className="np-logo" to="/">NotifyPro</RouterLink>
          <ul className="np-nav-links">
            <li><RouterLink to="/">Home</RouterLink></li>
            <li><RouterLink to="/docs">Docs</RouterLink></li>
            {!role && <li><RouterLink to="/login">Login</RouterLink></li>}
            {role && (role === 'admin' ? (
              <li><RouterLink to="/admin-dashboard">Dashboard</RouterLink></li>
            ) : (
              <li><RouterLink to="/app">Dashboard</RouterLink></li>
            ))}
          </ul>
          {!role ? (
            <RouterLink className="np-btn np-btn-primary" to="/login">Get Started</RouterLink>
          ) : (
            <RouterLink className="np-btn np-btn-secondary" to="/login" onClick={() => { try { localStorage.removeItem('token'); localStorage.removeItem('role'); } catch(_){} }}>Logout</RouterLink>
          )}
        </div>
      </nav>
      <div className="np-dashboard">
        <div className="np-dashboard-inner">
          <div className="np-card">
            <h1 style={{ fontSize: 28, margin: '0 0 16px 0', color: '#fff' }}>Integration Guide</h1>
            <ol style={{ paddingLeft: 24, lineHeight: 1.7, color: 'rgba(255,255,255,.9)' }}>
              <li style={{ marginBottom: 12 }}>
                <b>Get your API key</b> from the admin or your dashboard.
              </li>
              <li style={{ marginBottom: 12 }}>
                <b>Host a service worker at your site root</b>
                <pre style={{ background: 'rgba(0,0,0,0.4)', color: '#e0e6f0', padding: 12, borderRadius: 10, overflow: 'auto' }}>{`// /pn-sw.js at your site root
importScripts('http://13.126.228.42/pn-sw.js');`}</pre>
              </li>
              <li style={{ marginBottom: 12 }}>
                <b>Add the SDK to your pages</b>
                <pre style={{ background: 'rgba(0,0,0,0.4)', color: '#e0e6f0', padding: 12, borderRadius: 10, overflow: 'auto' }}>{`<script src="http://13.126.228.42/sdk.js" data-api-key="YOUR_API_KEY"></script>
<script>
  PN.init({ apiKey: 'YOUR_API_KEY', baseUrl: 'http://13.126.228.42/api/' });
</script>`}</pre>
              </li>
              <li style={{ marginBottom: 12 }}>
                <b>Programmatic (optional)</b>
                <pre style={{ background: 'rgba(0,0,0,0.4)', color: '#e0e6f0', padding: 12, borderRadius: 10, overflow: 'auto' }}>{`// Re-subscribe after unsubscribe
PN.unsubscribe().then(() => PN.init({ apiKey: 'YOUR_API_KEY', baseUrl: 'http://13.126.228.42/api/' }));`}</pre>
              </li>
              <li style={{ marginBottom: 12 }}>
                <b>Test</b>: Visit your site, then send a test from the dashboard. You should see a browser push.
              </li>
            </ol>
            <div style={{ color: 'rgba(255,255,255,.8)', marginTop: 12 }}>Notes: HTTPS in production (localhost allowed). Allow notifications and ensure OS Do Not Disturb is off.</div>
          </div>

          <div className="np-card" style={{ marginTop: 16 }}>
            <h2 style={{ fontSize: 24, margin: '0 0 12px 0', color: '#fff' }}>Send Push Notifications</h2>
            <p style={{ color: 'rgba(255,255,255,.9)', marginBottom: 12 }}>
              Use your customer credentials to obtain a JWT, then call the send API. This sends to all active subscriptions for your account.
            </p>
            <ol style={{ paddingLeft: 24, lineHeight: 1.7, color: 'rgba(255,255,255,.9)' }}>
              <li style={{ marginBottom: 12 }}>
                <b>Authenticate to get a token</b>
                <pre style={{ background: 'rgba(0,0,0,0.4)', color: '#e0e6f0', padding: 12, borderRadius: 10, overflow: 'auto' }}>{`curl -X POST http://13.126.228.42/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","password":"YOUR_PASSWORD"}'

# Response example
{"token":"<JWT>", "role":"customer", "email":"customer@example.com"}`}</pre>
              </li>
              <li style={{ marginBottom: 12 }}>
                <b>Send a notification</b>
                <pre style={{ background: 'rgba(0,0,0,0.4)', color: '#e0e6f0', padding: 12, borderRadius: 10, overflow: 'auto' }}>{`curl -X POST http://13.126.228.42/api/customer/notify \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hello from NotifyPro",
    "body": "This is a test push",
    "url": "https://your-site.example"
  }'

# Response
{"sent": N, "failed": M}`}</pre>
              </li>
              <li style={{ marginBottom: 12 }}>
                <b>Node.js example</b>
                <pre style={{ background: 'rgba(0,0,0,0.4)', color: '#e0e6f0', padding: 12, borderRadius: 10, overflow: 'auto' }}>{`const token = '<JWT>'
await fetch('http://13.126.228.42/api/customer/notify', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ title: 'Hello', body: 'Welcome!', url: 'https://example.com' })
}).then(r => r.json()).then(console.log);`}</pre>
              </li>
            </ol>
            <h3 style={{ color: '#fff', margin: '12px 0 8px' }}>Troubleshooting</h3>
            <ul style={{ paddingLeft: 20, color: 'rgba(255,255,255,.9)', lineHeight: 1.7 }}>
              <li><b>401 Unauthorized</b>: Use the JWT from <code>/api/auth/login</code> in the <code>Authorization: Bearer &lt;JWT&gt;</code> header.</li>
              <li><b>400 Missing VAPID keys</b>: Generate once via dashboard or API:
                <pre style={{ background: 'rgba(0,0,0,0.4)', color: '#e0e6f0', padding: 12, borderRadius: 10, overflow: 'auto', marginTop: 8 }}>{`curl -X POST http://13.126.228.42/api/customer/generate-vapid \
-H "Authorization: Bearer <JWT>"`}</pre>
              </li>
              <li><b>No push received</b>: Ensure the browser granted notification permission, service worker is registered at <code>/pn-sw.js</code>, and at least one subscription exists.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

