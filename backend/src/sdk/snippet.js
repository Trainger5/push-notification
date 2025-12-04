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
      try {
        // Try to get API key from multiple sources
        this.apiKey = apiKey || this.apiKey || this._getApiKeyFromScript();
        if (!this.apiKey) {
          const error = new Error('Missing apiKey - Please provide apiKey in init() or via data-api-key attribute');
          console.error('❌ Push Notifications Init Error:', error.message);
          throw error;
        }

        // Always default to a same-origin service worker
        this.serviceWorkerUrl = serviceWorkerUrl || '/pn-sw.js';
        if (baseUrl) {
          const trimmed = String(baseUrl).replace(/\/+$/, '');
          const apiBase = /\/api$/i.test(trimmed) ? trimmed : trimmed + '/api';
          this.configEndpoint = apiBase + '/config';
          this.subscribeEndpoint = apiBase + '/subscribe';
          this.unsubscribeEndpoint = apiBase + '/unsubscribe';
        }

        // Fetch configuration with timeout and error handling
        let cfgRes;
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

          cfgRes = await fetch(`${this.configEndpoint}?apiKey=${encodeURIComponent(this.apiKey)}`, {
            signal: controller.signal
          });
          clearTimeout(timeout);

          if (!cfgRes.ok) {
            throw new Error(`Configuration fetch failed:${cfgRes.status} - ${cfgRes.status === 404 ? 'Invalid API key' : 'Server error'}`);
          }
        } catch (fetchError) {
          if (fetchError.name === 'AbortError') {
            throw new Error('Configuration request timed out - Please check your server connection');
          }
          console.error('❌ Failed to fetch configuration:', fetchError);
          throw new Error(`Network error: ${fetchError.message}`);
        }

        const cfg = await cfgRes.json();
        this.vapidPublicKey = cfg.vapidPublicKey || cfg.vapid_public_key || null;

        if (!this.vapidPublicKey) {
          throw new Error('VAPID public key not found in server configuration');
        }

        // Check browser support
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          const error = new Error('Push notifications are not supported in this browser');
          console.warn('⚠️', error.message);
          throw error;
        }

        // Request permission with error handling
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.warn('⚠️ User denied notification permission');

            // Track permission denial for analytics
            try {
              await fetch(`${this.configEndpoint.replace('/config', '/metrics/permission-denied')}?apiKey=${encodeURIComponent(this.apiKey)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'user_denied' })
              });
            } catch (e) {
              // Silent fail - don't break if metrics endpoint fails
            }

            return { success: false, reason: 'permission_denied' };
          }
        }

        if (Notification.permission !== 'granted') {
          console.warn('⚠️ Notifications permission not granted');
          return { success: false, reason: 'permission_not_granted' };
        }

        // Register service worker with error handling
        let sw, registration;
        try {
          sw = await navigator.serviceWorker.register(this.serviceWorkerUrl);
          registration = await navigator.serviceWorker.ready;
        } catch (swError) {
          console.error('❌ Service worker registration failed:', swError);
          throw new Error(`Failed to register service worker: ${swError.message}`);
        }

        // Send configuration to service worker
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CONFIG',
            baseUrl: baseUrl || window.location.origin
          });
        }

        // Create push subscription with error handling
        try {
          let sub = await registration.pushManager.getSubscription();
          if (!sub && this.vapidPublicKey) {
            const converted = urlBase64ToUint8Array(this.vapidPublicKey);
            sub = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: converted
            });
          }

          if (sub) {
            // Save subscription to server
            const saveRes = await fetch(this.subscribeEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ apiKey: this.apiKey, subscription: sub })
            });

            if (!saveRes.ok) {
              throw new Error(`Failed to save subscription: ${saveRes.status}`);
            }
          }

          console.log('✅ Push notifications initialized successfully');
          return { success: true, subscription: sub };

        } catch (subError) {
          console.error('❌ Push subscription failed:', subError);
          throw new Error(`Subscription error: ${subError.message}`);
        }

      } catch (error) {
        console.error('❌ Push Notifications Init failed:', error);
        // Return error object instead of throwing to allow graceful degradation
        return {
          success: false,
          error: error.message,
          details: error
        };
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

