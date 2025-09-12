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
      
      // Fetch configuration and VAPID public key
      const cfgRes = await fetch(`${this.configEndpoint}?apiKey=${encodeURIComponent(this.apiKey)}`);
      const cfg = await cfgRes.json();
      this.vapidPublicKey = cfg.vapidPublicKey || cfg.vapid_public_key || null;
      
      // Check browser support
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push not supported in this browser');
        return { supported: false };
      }
      
      // Register service worker (but don't request permission)
      const sw = await navigator.serviceWorker.register(this.serviceWorkerUrl);
      await navigator.serviceWorker.ready;
      
      // Check if already subscribed (without requesting permission)
      if (Notification.permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          // Sync existing subscription with server
          await fetch(this.subscribeEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: this.apiKey, subscription: existingSub })
          });
        }
      }
      
      return { 
        supported: true, 
        permission: Notification.permission,
        subscribed: !!(await this._getCurrentSubscription())
      };
    },

    async subscribe() {
      if (!this.apiKey) throw new Error('SDK not initialized. Call PN.init() first.');
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push notifications not supported in this browser');
      }
      
      // Request permission if needed (only when user triggers this)
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Notifications permission denied');
        }
      } else if (Notification.permission === 'denied') {
        throw new Error('Notifications permission was previously denied');
      }
      
      const registration = await navigator.serviceWorker.ready;
      let sub = await registration.pushManager.getSubscription();
      
      if (!sub) {
        if (!this.vapidPublicKey) {
          throw new Error('VAPID public key not configured');
        }
        const converted = urlBase64ToUint8Array(this.vapidPublicKey);
        sub = await registration.pushManager.subscribe({ 
          userVisibleOnly: true, 
          applicationServerKey: converted 
        });
      }
      
      // Save subscription to server
      const response = await fetch(this.subscribeEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: this.apiKey, subscription: sub })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save subscription to server');
      }
      
      return { success: true, subscription: sub };
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

    async _getCurrentSubscription() {
      try {
        const registration = await navigator.serviceWorker.ready;
        return await registration.pushManager.getSubscription();
      } catch {
        return null;
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


