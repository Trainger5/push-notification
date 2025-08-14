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
  PN.init({ baseUrl: 'http://13.126.228.42/api/' });
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
        </div>
      </div>
    </div>
  )
}

