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

    async init({ apiKey, baseUrl, serviceWorkerUrl }) {
      // Try to get API key from multiple sources
      this.apiKey = apiKey || this.apiKey || this._getApiKeyFromScript();
      if (!this.apiKey) throw new Error('Missing apiKey');
      // Always default to a same-origin service worker. Do NOT switch to a remote URL
      // automatically, as service workers must be registered from the same origin
      // as the page. If you need to load logic from a remote origin, host a local
      // stub at '/pn-sw.js' that uses importScripts('https://remote/pn-sw.js').
      this.serviceWorkerUrl = serviceWorkerUrl || '/pn-sw.js';
      if (baseUrl) {
        const trimmed = String(baseUrl).replace(/\/+$/, '');
        const apiBase = /\/api$/i.test(trimmed) ? trimmed : trimmed + '/api';
        this.configEndpoint = apiBase + '/config';
        this.subscribeEndpoint = apiBase + '/subscribe';
        this.unsubscribeEndpoint = apiBase + '/unsubscribe';
        // Important: do not change serviceWorkerUrl automatically to a remote origin.
        // Keep it same-origin unless explicitly overridden by the integrator.
      }
      const cfgRes = await fetch(`${this.configEndpoint}?apiKey=${encodeURIComponent(this.apiKey)}`);
      const cfg = await cfgRes.json();
      this.vapidPublicKey = cfg.vapidPublicKey || cfg.vapid_public_key || null;
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
      const sw = await navigator.serviceWorker.register(this.serviceWorkerUrl);
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

    async subscribe() {
      if (!this.apiKey) throw new Error('SDK not initialized. Call PN.init() first.');
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push notifications not supported in this browser');
      }
      
      // Request permission if needed
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      if (Notification.permission !== 'granted') {
        throw new Error('Notifications permission denied');
      }
      
      const registration = await navigator.serviceWorker.ready;
      let sub = await registration.pushManager.getSubscription();
      
      if (!sub && this.vapidPublicKey) {
        const converted = urlBase64ToUint8Array(this.vapidPublicKey);
        sub = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: converted });
        
        // Save new subscription
        await fetch(this.subscribeEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: this.apiKey, subscription: sub })
        });
      }
      
      return sub;
    },

    async unsubscribe() {
      if (!this.apiKey) throw new Error('SDK not initialized. Call PN.init() first.');
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
      return true;
    },

    async getSubscriptionStatus() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return { 
          isSupported: false, 
          isSubscribed: false, 
          permission: Notification.permission,
          error: 'Push notifications not supported'
        };
      }
      
      try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        return {
          isSupported: true,
          isSubscribed: !!sub,
          permission: Notification.permission,
          subscription: sub,
          endpoint: sub?.endpoint
        };
      } catch (error) {
        return {
          isSupported: false,
          isSubscribed: false,
          permission: Notification.permission,
          error: error.message
        };
      }
    },

    _getApiKeyFromScript() {
      if (typeof document === 'undefined') return null;
      
      // Try current script first
      if (document.currentScript?.dataset?.apiKey) {
        return document.currentScript.dataset.apiKey;
      }
      
      // Fallback: search all script tags with src containing sdk.js
      const scripts = document.querySelectorAll('script[src*="sdk.js"][data-api-key]');
      if (scripts.length > 0) {
        return scripts[scripts.length - 1].dataset.apiKey;
      }
      
      return null;
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


