(function () {
    const app = document.getElementById('app');
    const state = { token: null, role: null, email: null, apiBase: '/api', route: null };

    function setState(next) {
        Object.assign(state, next);
        render();
    }

  function showModal({ title = 'Notice', message, contactUrl }) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.5)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '9999';

    const card = document.createElement('div');
    card.className = 'card';
    card.style.maxWidth = '520px';
    card.style.width = '92%';
    card.innerHTML = `
      <div class="header"><h3>${title}</h3></div>
      <div style="padding: 4px 0 12px 0; line-height: 1.5;">${message}</div>
      <div style="display:flex; gap:8px; justify-content:flex-end;">
        ${contactUrl ? `<a class="btn" href="${contactUrl}" target="_blank" rel="noopener">Contact Admin</a>` : ''}
        <button class="btn secondary" id="modalCloseBtn">Close</button>
      </div>
    `;
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) document.body.removeChild(overlay);
    });
    card.querySelector('#modalCloseBtn').onclick = () => document.body.removeChild(overlay);
  }

    function getRoute() {
        const hash = (location.hash || '#/home').replace(/^#\//, '');
        return hash || 'home';
    }

    window.addEventListener('hashchange', () => setState({ route: getRoute() }));

    async function api(path, opts = {}) {
        const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
        if (state.token) headers.Authorization = `Bearer ${state.token}`;
        const res = await fetch(`${state.apiBase}${path}`, { ...opts, headers });
        if (!res.ok) throw new Error((await res.json()).error || res.statusText);
        return res.json();
    }

    function Login() {
        const el = document.createElement('div');
        el.className = 'container login-container';
        el.innerHTML = `
            <div class="card login-card">
                <div class="header"><h2>Welcome Back</h2><span class="muted">Sign in to your account</span></div>
                <div class="row">
                    <div class="col-6">
                        <label>Email Address</label>
                        <input id="email" placeholder="you@example.com" type="email" />
                    </div>
                    <div class="col-6">
                        <label>Password</label>
                        <input id="password" type="password" placeholder="••••••••" />
                    </div>
                </div>
                <div style="margin-top:24px"><button id="login" class="btn">Sign In</button></div>
                <div style="margin-top:16px; text-align: center;" class="muted">Default admin: admin@example.com / ChangeMe!234</div>
            </div>`;
    el.querySelector('#login').onclick = async () => {
      const email = el.querySelector('#email').value;
      const password = el.querySelector('#password').value;
      try {
        const res = await fetch(`${state.apiBase}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
          let data = {};
          try { data = await res.json(); } catch (_) {}
          if (res.status === 403 && data?.error === 'Account disabled') {
            showModal({
              title: 'Account Disabled',
              message: 'Your account has been blocked. Please contact the administrator to re-enable access.',
              contactUrl: data?.contactUrl || null
            });
            return;
          }
          throw new Error(data.error || res.statusText);
        }
        const r = await res.json();
        setState({ token: r.token, role: r.role, email: r.email });
      } catch (e) {
        alert(e.message);
      }
    };
        return el;
    }

    function Header() {
        const el = document.createElement('div');
        el.className = 'header container';
        el.innerHTML = `
            <div style="display:flex;gap:16px;align-items:center;">
                <a href="#/home" style="text-decoration:none"><strong>Push Notification Service</strong></a>
                <nav class="nav">
                    <a href="#/home" class="${state.route === 'home' ? 'active' : ''}">Home</a>
                    <a href="#/docs" class="${state.route === 'docs' ? 'active' : ''}">Docs</a>
                    ${state.token ? '<a href="#/app" class="' + (state.route === 'app' ? 'active' : '') + '">Dashboard</a>' : ''}
                </nav>
            </div>
            <div>${state.email ? `<span class="muted">${state.email}</span> <button class="btn secondary" id="logout">Logout</button>` : ''}</div>`;
        if (state.email) {
            el.querySelector('#logout').onclick = () => setState({ token: null, role: null, email: null });
        }
        return el;
    }

    function Home() {
        const el = document.createElement('div');
        el.className = 'container';
        el.innerHTML = `
            <section class="card hero">
                <h1 class="hero-title">Add Push Notifications to your site in minutes</h1>
                <p class="hero-subtitle">Simple SDK, auto-generated VAPID, customer API keys, and a clean dashboard to manage subscribers and send notifications.</p>
                <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
                    <a class="btn" href="#/docs">Get Started</a>
                    ${state.token ? '<a class="btn secondary" href="#/app">Open Dashboard</a>' : '<a class="btn secondary" href="#/login">Sign In</a>'}
                </div>
            </section>
            <section class="feature-list" style="margin-bottom: 20px;">
                <div class="feature"><h3>1. Create Customer</h3><p>Admin generates a customer account and API key.</p></div>
                <div class="feature"><h3>2. Add SDK</h3><p>Paste a small script and stub service worker on your site.</p></div>
                <div class="feature"><h3>3. Send</h3><p>Use the dashboard to broadcast notifications to your subscribers.</p></div>
            </section>
            <section class="card">
                <h3>Pricing</h3>
                <div class="row">
                    <div class="col-4">
                        <div class="card" style="margin:0">
                            <h3>Starter</h3>
                            <div class="muted">Up to 1,000 subscribers</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="card" style="margin:0">
                            <h3>Pro</h3>
                            <div class="muted">Up to 10,000 subscribers</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="card" style="margin:0">
                            <h3>Enterprise</h3>
                            <div class="muted">Custom limits and SLAs</div>
                        </div>
                    </div>
                </div>
            </section>
            <section class="card">
                <h3>FAQ</h3>
                <div class="muted"><strong>Do I need HTTPS?</strong> Yes in production; localhost works for testing.</div>
                <div class="muted"><strong>Can I rotate VAPID keys?</strong> Yes, from your dashboard.</div>
                <div class="muted"><strong>How do users subscribe?</strong> Include the SDK and the service worker stub; we handle the rest.</div>
            </section>
            <section class="card">
                <h3>Changelog</h3>
                <div class="muted">v0.1: Initial release with Admin/Customer dashboards, SDK, auto VAPID.</div>
            </section>
        `;
        return el;
    }

    function Docs() {
        const el = document.createElement('div');
        el.className = 'container';
        el.innerHTML = `
            <div class="card">
                <h2>Integration Guide</h2>
                <ol>
                    <li style="margin-bottom:14px;">
                        <strong>Get your API key</strong><br/>
                        Ask your admin for your API key, or find it in your dashboard after logging in.
                    </li>
                    <li style="margin-bottom:14px;">
                        <strong>Host a service worker at your site root</strong><br/>
                        Create <code>/pn-sw.js</code> at your domain root with:
                        <pre><code>// /pn-sw.js at your site root
importScripts('https://YOUR_BACKEND_HOST/pn-sw.js');</code></pre>
                        Browsers require the service worker to be same-origin as your pages.
                    </li>
                    <li style="margin-bottom:14px;">
                        <strong>Add the SDK to your pages</strong><br/>
                        Paste before closing <code>&lt;/body&gt;</code>:
                        <pre><code>&lt;script src="https://YOUR_BACKEND_HOST/sdk.js" data-api-key="YOUR_API_KEY"&gt;&lt;/script&gt;
&lt;script&gt;
  PN.init({ baseUrl: 'https://YOUR_BACKEND_HOST' });
&lt;/script&gt;</code></pre>
                    </li>
                    <li style="margin-bottom:14px;">
                        <strong>Programmatic (optional)</strong>
                        <pre><code>// Re-subscribe after unsubscribe
PN.unsubscribe().then(() => PN.init({ apiKey: 'YOUR_API_KEY', baseUrl: 'https://YOUR_BACKEND_HOST' }));</code></pre>
                    </li>
                    <li style="margin-bottom:14px;">
                        <strong>Test</strong><br/>
                        After visiting your site once, open your dashboard and send a test notification. You should receive a browser push.
                    </li>
                </ol>
                <div class="muted">Notes: Use HTTPS in production. Local testing works on http://localhost in most browsers. Allow notifications for your site and ensure OS Do Not Disturb is off.</div>
            </div>
        `;
        return el;
    }

    function Admin() {
        const el = document.createElement('div');
        el.className = 'container';
        const listEl = document.createElement('div');
        const formEl = document.createElement('div');
        formEl.className = 'card';
        formEl.innerHTML = `
            <h3>Create New Customer</h3>
            <div class="row">
                <div class="col-4"><label>Company Name</label><input id="name" placeholder="Acme Inc" /></div>
                <div class="col-4"><label>Email Address</label><input id="email" placeholder="owner@acme.com" type="email" /></div>
                <div class="col-4"><label>Temporary Password</label><input id="password" placeholder="Temporary pass" type="password" /></div>
            </div>
            <div style="margin-top:20px"><button id="create" class="btn">Create Customer</button></div>`;
        formEl.querySelector('#create').onclick = async () => {
            try {
                const body = JSON.stringify({ 
                    name: formEl.querySelector('#name').value, 
                    email: formEl.querySelector('#email').value, 
                    password: formEl.querySelector('#password').value 
                });
                await api('/admin/customers', { method: 'POST', body });
                // Clear form
                formEl.querySelector('#name').value = '';
                formEl.querySelector('#email').value = '';
                formEl.querySelector('#password').value = '';
                await load();
            } catch (e) { 
                alert(e.message); 
            }
        };
        el.appendChild(formEl);
        
        const customersEl = document.createElement('div');
        customersEl.className = 'card';
        customersEl.innerHTML = `<h3>Customer Management</h3><div id="customers"></div>`;
        el.appendChild(customersEl);

        async function load() {
            const customers = await api('/admin/customers');
            const wrap = customersEl.querySelector('#customers');
            wrap.innerHTML = '';
            customers.forEach((c) => {
                const row = document.createElement('div');
                row.className = 'row customer-row';
                row.innerHTML = `
                    <div class="col-4">
                        <label>Customer</label>
                        <div><strong>${c.name}</strong></div>
                        <div class="muted">${c.email}</div>
                    </div>
                    <div class="col-4">
                        <label>API Key</label>
                        <input value="${c.apiKey}" readonly />
                    </div>
                    <div class="col-2">
                        <label>Status</label>
                        <div class="${c.active ? 'status-active' : 'status-inactive'}">${c.active ? '● Active' : '● Inactive'}</div>
                    </div>
                    <div class="col-2">
                        <button class="btn secondary" data-id="${c._id}" data-action="toggle" style="margin-bottom: 10px; width: 100%;">
                            ${c.active ? 'Disable' : 'Enable'}
                        </button>
                        <button class="btn" data-id="${c._id}" data-action="regen" style="width: 100%;">
                            Regenerate Key
                        </button>
                    </div>`;
                wrap.appendChild(row);
            });
            wrap.querySelectorAll('button').forEach((b) => {
                b.onclick = async () => {
                    const id = b.getAttribute('data-id');
                    const action = b.getAttribute('data-action');
                    try {
                        if (action === 'toggle') await api(`/admin/customers/${id}/toggle`, { method: 'PATCH' });
                        if (action === 'regen') await api(`/admin/customers/${id}/keys/regenerate`, { method: 'POST' });
                        await load();
                    } catch (e) { 
                        alert(e.message); 
                    }
                };
            });
        }
        load();
        return el;
    }

    function Customer() {
        const el = document.createElement('div');
        el.className = 'container';
        const infoEl = document.createElement('div');
        infoEl.className = 'card';
        const settingsEl = document.createElement('div');
        settingsEl.className = 'card';
        const subsEl = document.createElement('div');
        subsEl.className = 'card';

        async function load() {
            const me = await api('/customer/me');
            infoEl.innerHTML = `
                <h3>Account Overview</h3>
                <div class="row">
                    <div class="col-4">
                        <label>Company Name</label>
                        <div><strong>${me.customer.name}</strong></div>
                    </div>
                    <div class="col-4">
                        <label>API Key</label>
                        <div style="font-family: monospace; background: rgba(247, 250, 252, 0.8); padding: 10px; border-radius: 8px; word-break: break-all;">${me.customer.apiKey}</div>
                    </div>
                    <div class="col-4">
                        <label>Total Subscribers</label>
                        <div style="font-size: 2rem; font-weight: bold; color: #667eea;">${me.subscriberCount}</div>
                    </div>
                </div>`;

            settingsEl.innerHTML = `
                <h3>Push Notification Settings</h3>
                <div class="row">
                    <div class="col-4"><label>VAPID Public Key</label><input id="vpk" value="${me.settings?.vapidPublicKey || ''}" placeholder="Your VAPID public key" /></div>
                    <div class="col-4"><label>VAPID Private Key</label><input id="vsk" value="${me.settings?.vapidPrivateKey || ''}" placeholder="Your VAPID private key" /></div>
                    <div class="col-4"><label>VAPID Subject</label><input id="vsu" value="${me.settings?.vapidSubject || ''}" placeholder="mailto:you@example.com" /></div>
                    <div class="col-4"><label>Default Title</label><input id="title" value="${me.settings?.title || ''}" placeholder="Your App Name" /></div>
                    <div class="col-4"><label>Icon URL</label><input id="iconUrl" value="${me.settings?.iconUrl || ''}" placeholder="https://example.com/icon.png" /></div>
                    <div class="col-4"><label>Badge URL</label><input id="badgeUrl" value="${me.settings?.badgeUrl || ''}" placeholder="https://example.com/badge.png" /></div>
                    <div class="col-4"><label>Default Click URL</label><input id="defaultUrl" value="${me.settings?.defaultUrl || ''}" placeholder="https://yourapp.com" /></div>
                </div>
                <div style="margin-top:20px"><button id="saveSettings" class="btn">Save Settings</button></div>
                
                <div class="test-section">
                    <h4>Send Test Notification</h4>
                    <div class="row">
                        <div class="col-4"><label>Title</label><input id="ntitle" placeholder="Hello World!" /></div>
                        <div class="col-4"><label>Message Body</label><input id="nbody" placeholder="This is a test notification" /></div>
                        <div class="col-4"><label>Click URL</label><input id="nurl" placeholder="https://example.com" /></div>
                    </div>
                    <div style="margin-top:15px"><button id="sendTest" class="btn">Send Test</button></div>
                </div>`;

            settingsEl.querySelector('#saveSettings').onclick = async () => {
                try {
                    const body = JSON.stringify({
                        vapidPublicKey: settingsEl.querySelector('#vpk').value,
                        vapidPrivateKey: settingsEl.querySelector('#vsk').value,
                        vapidSubject: settingsEl.querySelector('#vsu').value,
                        title: settingsEl.querySelector('#title').value,
                        iconUrl: settingsEl.querySelector('#iconUrl').value,
                        badgeUrl: settingsEl.querySelector('#badgeUrl').value,
                        defaultUrl: settingsEl.querySelector('#defaultUrl').value
                    });
                    await api('/customer/settings', { method: 'POST', body });
                    await load();
                } catch (e) { 
                    alert(e.message); 
                }
            };

            settingsEl.querySelector('#sendTest').onclick = async () => {
                try {
                    const body = JSON.stringify({
                        title: settingsEl.querySelector('#ntitle').value,
                        body: settingsEl.querySelector('#nbody').value,
                        url: settingsEl.querySelector('#nurl').value
                    });
                    const r = await api('/customer/notify', { method: 'POST', body });
                    alert(`✅ Notification sent!\nDelivered: ${r.sent}\nFailed: ${r.failed}`);
                } catch (e) { 
                    alert(e.message); 
                }
            };

            const subs = await api('/customer/subscribers');
            subsEl.innerHTML = `
                <h3>Active Subscribers (${subs.length})</h3>
                ${subs.length === 0 ? 
                    '<div class="muted" style="text-align: center; padding: 40px;">No subscribers yet. Share your push notification integration to start receiving subscribers.</div>' :
                    subs.map((s) => `<div class="subscriber-item">${s.endpoint}</div>`).join('')
                }`;
        }

        el.appendChild(infoEl);
        el.appendChild(settingsEl);
        el.appendChild(subsEl);
        load();
        return el;
    }

    function Footer() {
        const el = document.createElement('div');
        el.className = 'container';
        const inner = document.createElement('div');
        inner.className = 'card';
        inner.style.textAlign = 'center';
        inner.innerHTML = `<div class="muted">© ${new Date().getFullYear()} Push Notification Service · <a href="#/docs">Docs</a></div>`;
        el.appendChild(inner);
        return el;
    }

    function render() {
        app.innerHTML = '';
        app.appendChild(Header());
        // Routing
        const route = state.route || getRoute();
        if (!state.token) {
            if (route === 'docs') return app.appendChild(Docs());
            if (route === 'login') return app.appendChild(Login());
            app.appendChild(Home());
            return app.appendChild(Footer());
        }
        if (route === 'docs') return app.appendChild(Docs());
        // Dashboard
        if (state.role === 'admin') {
            app.appendChild(Admin());
            return app.appendChild(Footer());
        }
        app.appendChild(Customer());
        return app.appendChild(Footer());
    }

    // Init route and first render
    if (!location.hash) location.hash = '#/home';
    state.route = getRoute();
    render();
})();