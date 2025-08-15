import { useEffect, useMemo, useState, useRef } from 'react'
import { Input } from '@chakra-ui/react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import '../styles/notifypro.css'

function useApi() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
  const headers = useMemo(() => (token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }), [token])
  const apiBaseRaw =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || ''
  const apiBase = (apiBaseRaw || '').toString().replace(/\/?$/, '')
  const full = (p) => (apiBase ? `${apiBase}${p}` : p)
  return {
    async get(path) {
      const res = await fetch(full('/api' + path), { headers })
      if (!res.ok) throw new Error((await res.json()).error || res.statusText)
      return res.json()
    },
    async post(path, body) {
      const res = await fetch(full('/api' + path), { method: 'POST', headers, body: JSON.stringify(body) })
      if (!res.ok) throw new Error((await res.json()).error || res.statusText)
      return res.json()
    },
    async patch(path, body) {
      const res = await fetch(full('/api' + path), { method: 'PATCH', headers, body: JSON.stringify(body) })
      if (!res.ok) throw new Error((await res.json()).error || res.statusText)
      return res.json()
    },
  }
}

function Toast({ message }) {
  return (
    <div className={message ? 'np-toast show' : 'np-toast'}>{message}</div>
  )
}

export default function NotifyPro() {
  const [page, setPage] = useState('landing')
  const [toast, setToast] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  // removed backend URL input; using build-time VITE_API_BASE
  const [role, setRole] = useState(typeof localStorage !== 'undefined' ? localStorage.getItem('role') : null)
  const [customers, setCustomers] = useState([])
  const [createForm, setCreateForm] = useState({ companyName: '', email: '', password: '' })
  const [me, setMe] = useState(null)
  const [subs, setSubs] = useState([])
  const [sendForm, setSendForm] = useState({ title: '', message: '', url: '' })
  const sendingRef = useRef(false)
  const api = useApi()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const i = setInterval(() => {
      const n = document.querySelector('.np-notification')
      if (!n) return
      const items = [
        { t: 'Welcome Back!', b: "Check out what's new in your feed." },
        { t: 'Special Offer!', b: 'Get 30% off your next purchase. Limited time!' },
        { t: 'New Message', b: 'You have 3 unread messages.' },
        { t: 'Reminder', b: "Don't forget your appointment today." },
      ]
      const idx = Math.floor(Math.random() * items.length)
      const title = n.querySelector('div:nth-child(1) div:nth-child(2)')
      const body = n.querySelector('div:nth-child(2)')
      if (title) title.textContent = items[idx].t
      if (body) body.textContent = items[idx].b
    }, 4000)
    return () => clearInterval(i)
  }, [])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  // no-op

  // Route <-> page sync
  function pathToPage(pathname) {
    if (pathname === '/' || pathname === '/home') return 'landing'
    if (pathname === '/login' || pathname === '/admin') return 'login'
    if (pathname === '/admin-dashboard') return 'admin-dashboard'
    if (pathname === '/app') return 'customer-dashboard'
    return 'landing'
  }
  useEffect(() => { setPage(pathToPage(location.pathname)) }, [location.pathname])
  // NOTE: URL drives state. We don't navigate based on page to avoid loops.

  // If already authenticated and on /login, redirect to dashboard
  useEffect(() => {
    if (!role) return;
    if (location.pathname === '/login') {
      if (role === 'admin') {
        setPage('admin-dashboard');
        navigate('/admin-dashboard', { replace: true });
      } else {
        setPage('customer-dashboard');
        navigate('/app', { replace: true });
      }
    }
  }, [role, location.pathname]);

  // Guard dashboards if not authenticated
  useEffect(() => {
    if (role) return;
    if (location.pathname === '/admin-dashboard' || location.pathname === '/app') {
      setPage('login');
      navigate('/login', { replace: true });
    }
  }, [role, location.pathname]);

  // Load data when landing on dashboards (e.g., after refresh)
  useEffect(() => {
    if (page === 'admin-dashboard' && customers.length === 0) {
      loadCustomers().catch(() => {});
    }
    if (page === 'customer-dashboard' && !me) {
      loadMe().catch(() => {});
    }
  }, [page]);

  async function loadCustomers() {
    const list = await api.get('/admin/customers')
    setCustomers(list)
  }

  async function toggleCustomer(id) { await api.patch(`/admin/customers/${id}/toggle`); await loadCustomers(); }
  async function regenKey(id) { await api.post(`/admin/customers/${id}/keys/regenerate`); await loadCustomers(); showToast('API key regenerated'); }

  async function createCustomer(e) {
    e.preventDefault()
    await api.post('/admin/customers', { name: createForm.companyName, email: createForm.email, password: createForm.password })
    setCreateForm({ companyName: '', email: '', password: '' })
    await loadCustomers()
    showToast('Customer created')
  }

  async function onLogin(e) {
    e.preventDefault()
    try {
      const r = await api.post('/auth/login', { email: loginEmail, password: loginPassword })
      localStorage.setItem('token', r.token)
      localStorage.setItem('role', r.role)
      setRole(r.role)
      if (r.role === 'admin') {
        setAdminEmail(r.email)
        await loadCustomers()
        setPage('admin-dashboard')
        navigate('/admin-dashboard', { replace: true })
      } else {
        await loadMe()
        setPage('customer-dashboard')
        navigate('/app', { replace: true })
      }
      showToast('Welcome!')
    } catch (e) { showToast(e.message) }
  }

  async function loadMe() {
    const data = await api.get('/customer/me')
    setMe(data)
    try {
      const s = await api.get('/customer/subscribers')
      setSubs(s)
    } catch (_) {}
  }

  async function copyToClipboard(text) {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = String(text || '')
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.focus()
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      showToast('Copied to clipboard')
    } catch (e) {
      showToast('Copy failed')
    }
  }

  function logout() {
    localStorage.removeItem('token'); localStorage.removeItem('role');
    setMe(null); setCustomers([]); setLoginEmail(''); setLoginPassword(''); setRole(null);
    setPage('landing')
    showToast('Logged out')
  }

  return (
    <div className="np-page">
      <div className="np-gradient-bg" />
      <div className="np-glass-overlay" />
      <nav className="np-nav">
        <div className="np-nav-inner">
          <RouterLink className="np-logo" to="/">NotifyPro</RouterLink>
          <ul className="np-nav-links">
            <li><a href="#" onClick={(e)=>{e.preventDefault(); setPage('landing');}}>Home</a></li>
            <li><a href="#features" onClick={(e)=>{e.preventDefault(); setPage('landing'); setTimeout(()=>document.getElementById('np-features')?.scrollIntoView({behavior:'smooth'}),0)}}>Features</a></li>
            <li><RouterLink to="/pricing">Pricing</RouterLink></li>
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
            <button className="np-btn np-btn-secondary" onClick={logout}>Logout</button>
          )}
        </div>
      </nav>

      {page === 'landing' && (
        <>
          <section className="np-hero">
            <div className="np-hero-grid">
              <div>
                <h1 className="np-hero-title">Engage Users with Precision Push Notifications</h1>
                <p className="np-hero-sub">Deliver the right message at the right time. Our advanced push notification service helps you boost engagement, retain users, and drive conversions.</p>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                  <button className="np-btn np-btn-primary" onClick={() => setPage('login')}>Start Free Trial</button>
                  <a className="np-btn np-btn-secondary" href="#features" onClick={(e)=>{e.preventDefault(); setTimeout(()=>document.getElementById('np-features')?.scrollIntoView({behavior:'smooth'}),0)}}>View Features</a>
                </div>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>99.9%</div>
                    <div style={{ color: 'rgba(255,255,255,.7)' }}>Uptime</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>2.5B+</div>
                    <div style={{ color: 'rgba(255,255,255,.7)' }}>Daily Deliveries</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>50K+</div>
                    <div style={{ color: 'rgba(255,255,255,.7)' }}>Developers</div>
                  </div>
                </div>
              </div>
              <div className="np-phone">
                <div className="np-phone-screen">
                  <div className="np-notification">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#667eea,#764ba2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>N</div>
                      <div style={{ fontWeight: 600, color: '#1a1a1a' }}>Special Offer!</div>
                      <div style={{ color: '#666', fontSize: '.8rem', marginLeft: 'auto' }}>now</div>
                    </div>
                    <div style={{ color: '#333', fontSize: '.9rem' }}>Get 30% off your next purchase. Limited time offer!</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section id="np-features" className="np-features-hero">
            <h1>Powerful Features</h1>
            <p>Everything you need to integrate, send, and analyze push notifications that drive results</p>
          </section>
          <div className="np-features-grid">
            <div className="np-feature-card"><div className="np-feature-icon">🔑</div><h3>Auto VAPID</h3><p>Keys are generated per customer automatically or on demand.</p></div>
            <div className="np-feature-card"><div className="np-feature-icon">🧩</div><h3>Drop-in SDK</h3><p>Lightweight script and service worker stub to get started fast.</p></div>
            <div className="np-feature-card"><div className="np-feature-icon">👥</div><h3>Subscriber List</h3><p>See who’s subscribed and manage endpoints cleanly.</p></div>
            <div className="np-feature-card"><div className="np-feature-icon">📣</div><h3>Broadcast</h3><p>Send to all subscribers with title, message, and optional URL.</p></div>
            <div className="np-feature-card"><div className="np-feature-icon">🔒</div><h3>JWT Security</h3><p>Admin/customer roles with secure token-based access.</p></div>
            <div className="np-feature-card"><div className="np-feature-icon">📈</div><h3>Ready for Analytics</h3><p>APIs log sends; extend to measure open and click rates.</p></div>
          </div>

          {/* How it works */}
          <div className="np-card" style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h3 style={{ color:'#fff', marginBottom: 16 }}>How it Works</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
              <div className="np-card" style={{ margin:0 }}>
                <h4 style={{ color:'#fff', marginBottom:8 }}>1) Create Customer</h4>
                <p style={{ color:'rgba(255,255,255,.85)' }}>Admin issues an API key and credentials.</p>
              </div>
              <div className="np-card" style={{ margin:0 }}>
                <h4 style={{ color:'#fff', marginBottom:8 }}>2) Add SDK</h4>
                <p style={{ color:'rgba(255,255,255,.85)' }}>Include the script and host the service worker stub.</p>
              </div>
              <div className="np-card" style={{ margin:0 }}>
                <h4 style={{ color:'#fff', marginBottom:8 }}>3) Collect Subscribers</h4>
                <p style={{ color:'rgba(255,255,255,.85)' }}>Users opt-in; endpoints are saved securely.</p>
              </div>
              <div className="np-card" style={{ margin:0 }}>
                <h4 style={{ color:'#fff', marginBottom:8 }}>4) Send & Measure</h4>
                <p style={{ color:'rgba(255,255,255,.85)' }}>Broadcast notifications, then extend analytics.</p>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="np-card" style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h3 style={{ color:'#fff', marginBottom: 16 }}>What customers say</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
              <div className="np-card" style={{ margin:0 }}>
                <p style={{ color:'rgba(255,255,255,.9)' }}>“Setup was under 10 minutes. We went from zero to thousands of subscribers in a week.”</p>
                <div style={{ color:'#cbd5e1', marginTop: 8 }}>— Acme Inc.</div>
              </div>
              <div className="np-card" style={{ margin:0 }}>
                <p style={{ color:'rgba(255,255,255,.9)' }}>“Loved the simple SDK and dashboard. Sending promos is now effortless.”</p>
                <div style={{ color:'#cbd5e1', marginTop: 8 }}>— Boutique Co.</div>
              </div>
              <div className="np-card" style={{ margin:0 }}>
                <p style={{ color:'rgba(255,255,255,.9)' }}>“VAPID keys per client make our multi-tenant setup clean and secure.”</p>
                <div style={{ color:'#cbd5e1', marginTop: 8 }}>— SaaS Studio</div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="np-card" style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h3 style={{ color:'#fff', marginBottom: 16 }}>FAQ</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
              <div className="np-card" style={{ margin:0 }}>
                <h4 style={{ color:'#fff', marginBottom:8 }}>Do I need HTTPS?</h4>
                <p style={{ color:'rgba(255,255,255,.85)' }}>Yes in production; localhost works for development.</p>
              </div>
              <div className="np-card" style={{ margin:0 }}>
                <h4 style={{ color:'#fff', marginBottom:8 }}>Can I rotate VAPID keys?</h4>
                <p style={{ color:'rgba(255,255,255,.85)' }}>Yes. Generate new keys and update the dashboard settings.</p>
              </div>
              <div className="np-card" style={{ margin:0 }}>
                <h4 style={{ color:'#fff', marginBottom:8 }}>How do I subscribe users?</h4>
                <p style={{ color:'rgba(255,255,255,.85)' }}>Include the SDK and host the service worker at your site root.</p>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="np-card" style={{ maxWidth: 1200, margin: '0 auto', textAlign:'center' }}>
            <h3 style={{ color:'#fff', marginBottom: 12 }}>Ready to get started?</h3>
            <p style={{ color:'rgba(255,255,255,.85)', marginBottom: 16 }}>Sign in to your dashboard or browse the docs to integrate.</p>
            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
              <button className="np-btn np-btn-primary" onClick={() => setPage('login')}>Sign In</button>
              <RouterLink className="np-btn np-btn-secondary" to="/docs">View Docs</RouterLink>
            </div>
          </div>
        </>
      )}

      {page === 'login' && (
        <div className="np-form-wrap">
          <div className="np-form">
            <h2 className="np-form-title">Sign In</h2>
            <form onSubmit={onLogin}>
              <label className="np-label">Email</label>
              <Input className="np-input" value={loginEmail} onChange={(e)=>setLoginEmail(e.target.value)} placeholder="you@example.com" type="email" mb={4} />
              <label className="np-label">Password</label>
              <Input className="np-input" value={loginPassword} onChange={(e)=>setLoginPassword(e.target.value)} type="password" placeholder="••••••••" mb={6} />
              <button className="np-btn np-btn-primary" type="submit" style={{ width: '100%', marginTop: '1rem' }}>Login</button>
            </form>
          </div>
        </div>
      )}

      {page === 'admin-dashboard' && (
        <div className="np-dashboard">
          <div className="np-dashboard-inner">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
              <h1 className="np-hero-title" style={{ fontSize: '2.2rem' }}>Admin Dashboard</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#fff' }}>
                <span>{adminEmail}</span>
              </div>
            </div>
            <div className="np-stats">
              <div className="np-stat"><span className="np-stat-number">{customers.length}</span><div className="np-stat-label">Total Customers</div></div>
              <div className="np-stat"><span className="np-stat-number">{customers.filter(c=>c.active).length}</span><div className="np-stat-label">Active Customers</div></div>
              <div className="np-stat"><span className="np-stat-number">0</span><div className="np-stat-label">Notifications</div></div>
              <div className="np-stat"><span className="np-stat-number">$0</span><div className="np-stat-label">Monthly Revenue</div></div>
            </div>
            <div className="np-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
                <h3 style={{ color:'#fff', fontSize:'1.2rem' }}>Customer Management</h3>
                <button className="np-btn np-btn-primary" onClick={()=>{ const el=document.getElementById('np-create'); if(el) el.style.display='block' }}>Add New Customer</button>
              </div>
              <div id="np-create" style={{ display:'none', marginBottom:'1rem', padding:'1rem', background:'rgba(255,255,255,.05)', borderRadius:15 }}>
                <h4 style={{ color:'#fff', marginBottom:'.8rem' }}>Create New Customer</h4>
                <form onSubmit={createCustomer}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                    <div>
                      <label className="np-label">Company Name</label>
                      <Input className="np-input" value={createForm.companyName} onChange={(e)=>setCreateForm({ ...createForm, companyName: e.target.value })} required />
                    </div>
                    <div>
                      <label className="np-label">Contact Email</label>
                      <Input className="np-input" value={createForm.email} onChange={(e)=>setCreateForm({ ...createForm, email: e.target.value })} type="email" required />
                    </div>
                    <div>
                      <label className="np-label">Password</label>
                      <Input className="np-input" value={createForm.password} onChange={(e)=>setCreateForm({ ...createForm, password: e.target.value })} type="password" placeholder="At least 6 characters" required />
                    </div>
                  </div>
                  <div style={{ marginTop:'1rem' }}>
                    <button className="np-btn np-btn-primary" type="submit">Create Customer</button>
                    <button className="np-btn np-btn-secondary" type="button" style={{ marginLeft:'.8rem' }} onClick={()=>{ const el=document.getElementById('np-create'); if(el) el.style.display='none' }}>Cancel</button>
                  </div>
                </form>
              </div>
              <div className="np-table-wrap">
                <table className="np-table">
                  <thead><tr><th>ID</th><th>Company</th><th>Email</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
                  <tbody>
                    {customers.map(c => (
                      <tr key={c._id}>
                        <td>{c._id}</td>
                        <td>{c.name}</td>
                        <td>{c.email}</td>
                        <td><span className={c.active ? 'np-status-active' : 'np-status-inactive'}>{c.active ? 'Active' : 'Inactive'}</span></td>
                        <td>{new Date(c.createdAt).toISOString().split('T')[0]}</td>
                        <td>
                          <button className="np-btn np-btn-secondary" style={{ padding:'.3rem .8rem', fontSize:'.8rem' }} onClick={()=>toggleCustomer(c._id)}>{c.active ? 'Deactivate':'Activate'}</button>
                          <button className="np-btn np-btn-primary" style={{ padding:'.3rem .8rem', fontSize:'.8rem', marginLeft:'.5rem' }} onClick={()=>regenKey(c._id)}>Regenerate Key</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single login form handles both roles; removed duplicate forms */}

      {page === 'customer-dashboard' && me && (
        <div className="np-dashboard">
          <div className="np-dashboard-inner">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
              <h1 className="np-hero-title" style={{ fontSize: '2.2rem' }}>Dashboard</h1>
              <div style={{ display:'flex', alignItems:'center', gap:'1rem', color:'#fff' }}>
                <span>Welcome, {me.customer.name}</span>
              </div>
            </div>
            <div className="np-stats">
              <div className="np-stat"><span className="np-stat-number">{me.subscriberCount}</span><div className="np-stat-label">Total Subscribers</div></div>
              <div className="np-stat"><span className="np-stat-number">{(me.notificationStats?.sent ?? 0)}</span><div className="np-stat-label">Notifications Sent</div></div>
              <div className="np-stat"><span className="np-stat-number">{(me.notificationStats?.openRate ?? 0)}%</span><div className="np-stat-label">Open Rate</div></div>
              <div className="np-stat"><span className="np-stat-number">{(me.notificationStats?.clickRate ?? 0)}%</span><div className="np-stat-label">Click Rate</div></div>
            </div>
            <div className="np-card">
              <h3 style={{ color:'#fff', fontSize:'1.2rem', marginBottom:'1rem' }}>API Configuration</h3>
              <p style={{ color:'rgba(255,255,255,.8)', marginBottom:'1rem' }}>Use this API key to integrate push notifications.</p>
              <div className="np-api-key">
                <div className="np-api-key-code">{me.customer.apiKey}</div>
                <button className="np-btn np-btn-secondary" onClick={() => copyToClipboard(me.customer.apiKey)}>Copy</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast} />
    </div>
  )
}


