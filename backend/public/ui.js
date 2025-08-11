(function () {
  const app = document.getElementById('app');
  const state = { token: null, role: null, email: null, apiBase: '/api' };

  function setState(next) {
    Object.assign(state, next);
    render();
  }

  async function api(path, opts = {}) {
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (state.token) headers.Authorization = `Bearer ${state.token}`;
    const res = await fetch(`${state.apiBase}${path}`, { ...opts, headers });
    if (!res.ok) throw new Error((await res.json()).error || res.statusText);
    return res.json();
  }

  function Login() {
    const el = document.createElement('div');
    el.className = 'container';
    el.innerHTML = `
      <div class="card">
        <div class="header"><h2>Login</h2><span class="muted">Admin or Customer</span></div>
        <div class="row">
          <div class="col-6">
            <label>Email</label>
            <input id="email" placeholder="you@example.com" />
          </div>
          <div class="col-6">
            <label>Password</label>
            <input id="password" type="password" placeholder="••••••••" />
          </div>
        </div>
        <div style="margin-top:12px"><button id="login" class="btn">Sign in</button></div>
        <div style="margin-top:8px" class="muted">Default admin: admin@example.com / ChangeMe!234</div>
      </div>`;
    el.querySelector('#login').onclick = async () => {
      try {
        const email = el.querySelector('#email').value;
        const password = el.querySelector('#password').value;
        const r = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
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
    el.innerHTML = `<div><strong>Push Notification Service</strong></div><div>${state.email ? `<span class="muted">${state.email}</span> <button class="btn secondary" id="logout">Logout</button>` : ''}</div>`;
    if (state.email) {
      el.querySelector('#logout').onclick = () => setState({ token: null, role: null, email: null });
    }
    return el;
  }

  function Admin() {
    const el = document.createElement('div');
    el.className = 'container';
    const listEl = document.createElement('div');
    const formEl = document.createElement('div');
    formEl.className = 'card';
    formEl.innerHTML = `
      <h3>Create Customer</h3>
      <div class="row">
        <div class="col-4"><label>Name</label><input id="name" placeholder="Acme Inc" /></div>
        <div class="col-4"><label>Email</label><input id="email" placeholder="owner@acme.com" /></div>
        <div class="col-4"><label>Password</label><input id="password" placeholder="Temporary pass" /></div>
      </div>
      <div style="margin-top:12px"><button id="create" class="btn">Create</button></div>`;
    formEl.querySelector('#create').onclick = async () => {
      try {
        const body = JSON.stringify({ name: formEl.querySelector('#name').value, email: formEl.querySelector('#email').value, password: formEl.querySelector('#password').value });
        await api('/admin/customers', { method: 'POST', body });
        await load();
      } catch (e) { alert(e.message); }
    };
    el.appendChild(formEl);
    const customersEl = document.createElement('div');
    customersEl.className = 'card';
    customersEl.innerHTML = `<h3>Customers</h3><div id="customers"></div>`;
    el.appendChild(customersEl);

    async function load() {
      const customers = await api('/admin/customers');
      const wrap = customersEl.querySelector('#customers');
      wrap.innerHTML = '';
      customers.forEach((c) => {
        const row = document.createElement('div');
        row.className = 'row';
        row.style.borderTop = '1px solid #3a506b';
        row.style.paddingTop = '8px';
        row.innerHTML = `
          <div class="col-4"><strong>${c.name}</strong><div class="muted">${c.email}</div></div>
          <div class="col-4"><label>API Key</label><input value="${c.apiKey}" readonly /></div>
          <div class="col-2"><label>Status</label><div>${c.active ? 'Active' : 'Inactive'}</div></div>
          <div class="col-2"><button class="btn secondary" data-id="${c._id}" data-action="toggle">${c.active ? 'Disable' : 'Enable'}</button> <button class="btn" data-id="${c._id}" data-action="regen">Regenerate Key</button></div>`;
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
          } catch (e) { alert(e.message); }
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
      infoEl.innerHTML = `<h3>Overview</h3><div class="row"><div class="col-4"><label>Name</label><div>${me.customer.name}</div></div><div class="col-4"><label>API Key</label><div>${me.customer.apiKey}</div></div><div class="col-4"><label>Subscribers</label><div>${me.subscriberCount}</div></div></div>`;

      settingsEl.innerHTML = `
        <h3>Push Settings</h3>
        <div class="row">
          <div class="col-4"><label>VAPID Public Key</label><input id="vpk" value="${me.settings?.vapidPublicKey || ''}" /></div>
          <div class="col-4"><label>VAPID Private Key</label><input id="vsk" value="${me.settings?.vapidPrivateKey || ''}" /></div>
          <div class="col-4"><label>VAPID Subject</label><input id="vsu" value="${me.settings?.vapidSubject || ''}" /></div>
          <div class="col-4"><label>Default Title</label><input id="title" value="${me.settings?.title || ''}" /></div>
          <div class="col-4"><label>Icon URL</label><input id="iconUrl" value="${me.settings?.iconUrl || ''}" /></div>
          <div class="col-4"><label>Badge URL</label><input id="badgeUrl" value="${me.settings?.badgeUrl || ''}" /></div>
          <div class="col-4"><label>Default Click URL</label><input id="defaultUrl" value="${me.settings?.defaultUrl || ''}" /></div>
        </div>
        <div style="margin-top:12px"><button id="saveSettings" class="btn">Save Settings</button></div>
        <div style="margin-top:12px"><h4>Send Test Notification</h4>
          <div class="row">
            <div class="col-4"><label>Title</label><input id="ntitle" placeholder="Hello" /></div>
            <div class="col-4"><label>Body</label><input id="nbody" placeholder="World" /></div>
            <div class="col-4"><label>URL</label><input id="nurl" placeholder="https://example.com" /></div>
          </div>
          <div style="margin-top:12px"><button id="sendTest" class="btn">Send</button></div>
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
        } catch (e) { alert(e.message); }
      };

      settingsEl.querySelector('#sendTest').onclick = async () => {
        try {
          const body = JSON.stringify({
            title: settingsEl.querySelector('#ntitle').value,
            body: settingsEl.querySelector('#nbody').value,
            url: settingsEl.querySelector('#nurl').value
          });
          const r = await api('/customer/notify', { method: 'POST', body });
          alert(`Sent: ${r.sent}, Failed: ${r.failed}`);
        } catch (e) { alert(e.message); }
      };

      const subs = await api('/customer/subscribers');
      subsEl.innerHTML = `<h3>Subscribers</h3>` + subs.map((s) => `<div style="border-top:1px solid #3a506b;padding:6px 0">${s.endpoint}</div>`).join('');
    }

    el.appendChild(infoEl);
    el.appendChild(settingsEl);
    el.appendChild(subsEl);
    load();
    return el;
  }

  function render() {
    app.innerHTML = '';
    app.appendChild(Header());
    if (!state.token) return app.appendChild(Login());
    if (state.role === 'admin') return app.appendChild(Admin());
    return app.appendChild(Customer());
  }

  render();
})();


