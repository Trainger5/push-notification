/*
  Minimal Web Push SDK
  Usage on a website:

  <script src="https://YOUR_PUSH_SERVER/sdk.js"></script>
  <script>
    PushClient.init({ serverUrl: 'https://YOUR_PUSH_SERVER', siteId: 'YOUR_SITE_ID' });
  </script>
*/
(function () {
  const STATE = {
    initialized: false,
    serverUrl: null,
    siteId: null,
    swPath: '/sw.js'
  };

  async function getVapidPublicKey() {
    const res = await fetch(concatUrl(STATE.serverUrl, '/api/vapidPublicKey'));
    const json = await res.json();
    return json.publicKey;
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  function concatUrl(base, path) {
    if (!base.endsWith('/') && !path.startsWith('/')) return base + '/' + path;
    if (base.endsWith('/') && path.startsWith('/')) return base + path.slice(1);
    return base + path;
  }

  async function ensurePermission() {
    if (!('Notification' in window)) throw new Error('Notifications not supported');
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  async function registerServiceWorker(swPath) {
    if (!('serviceWorker' in navigator)) throw new Error('Service workers not supported');
    const registration = await navigator.serviceWorker.register(swPath);
    await navigator.serviceWorker.ready; // ensure active
    return registration;
  }

  async function subscribeToPush(registration, publicKey) {
    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });
    return subscription;
  }

  async function saveSubscription(subscription) {
    const res = await fetch(concatUrl(STATE.serverUrl, '/api/subscriptions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId: STATE.siteId, subscription })
    });
    if (!res.ok) throw new Error('Failed to save subscription');
    return res.json();
  }

  async function init(options) {
    if (STATE.initialized) return;
    if (!options || !options.serverUrl || !options.siteId) {
      throw new Error('Please provide serverUrl and siteId');
    }
    STATE.serverUrl = options.serverUrl.replace(/\/$/, '');
    STATE.siteId = options.siteId;
    STATE.swPath = options.swPath || '/sw.js';

    const hasPermission = await ensurePermission();
    if (!hasPermission) {
      console.warn('[PushClient] Notification permission not granted');
      return;
    }

    const registration = await registerServiceWorker(STATE.swPath);
    const publicKey = await getVapidPublicKey();
    const subscription = await subscribeToPush(registration, publicKey);
    await saveSubscription(subscription);

    STATE.initialized = true;
    console.log('[PushClient] Ready');
  }

  window.PushClient = { init };
})();


