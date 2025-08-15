// Minimal client SDK to embed on customer sites
// Usage:
// <script src="https://your-domain/sdk.js" data-api-key="CUSTOMER_API_KEY"></script>
// PN.init({ apiKey: 'CUSTOMER_API_KEY' });

/* global window, Notification */

(function () {
  const PN = {
    apiKey: null,
    vapidPublicKey: null,
    configEndpoint: '/api/config',
    subscribeEndpoint: '/api/subscribe',
    unsubscribeEndpoint: '/api/unsubscribe',

    async init({ apiKey, baseUrl }) {
      this.apiKey = apiKey || this.apiKey || (typeof document !== 'undefined' ? document.currentScript?.dataset?.apiKey : null);
      if (!this.apiKey) throw new Error('Missing apiKey');
      if (baseUrl) {
        const trimmed = String(baseUrl).replace(/\/+$/, '');
        const apiBase = /\/api$/i.test(trimmed) ? trimmed : trimmed + '/api';
        this.configEndpoint = apiBase + '/config';
        this.subscribeEndpoint = apiBase + '/subscribe';
        this.unsubscribeEndpoint = apiBase + '/unsubscribe';
      }
      const cfgRes = await fetch(`${this.configEndpoint}?apiKey=${encodeURIComponent(this.apiKey)}`);
      const cfg = await cfgRes.json();
      this.vapidPublicKey = cfg.vapidPublicKey || null;
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push not supported in this browser');
        return;
      }
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      if (Notification.permission !== 'granted') {
        console.warn('Notifications permission not granted');
        return;
      }
      const sw = await navigator.serviceWorker.register('/pn-sw.js');
      const registration = await navigator.serviceWorker.ready;
      let sub = await registration.pushManager.getSubscription();
      if (!sub && this.vapidPublicKey) {
        const converted = urlBase64ToUint8Array(this.vapidPublicKey);
        sub = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: converted });
      }
      if (sub) {
        await fetch(this.subscribeEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: this.apiKey, subscription: sub })
        });
      }
    },

    async unsubscribe() {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await fetch(this.unsubscribeEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: this.apiKey, endpoint: sub.endpoint })
        });
        await sub.unsubscribe();
      }
    }
  };

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  if (typeof window !== 'undefined') {
    window.PN = PN;
  }
})();


