class PushNotificationManager {
    constructor(options = {}) {
      this.serverUrl = options.serverUrl || '';
      this.vapidPublicKey = null;
      this.swRegistration = null;
      window.addEventListener('DOMContentLoaded', () => this.init());
    }
    async init() {
      if (!('serviceWorker' in navigator && 'PushManager' in window)) {
        this.showStatus('Not supported in this browser');
        return;
      }
      const res = await fetch(`${this.serverUrl}/api/vapid-public-key`);
      this.vapidPublicKey = (await res.json()).publicKey;
      this.swRegistration = await navigator.serviceWorker.register('/service-worker.js');
      document.getElementById('subscribe-btn').onclick = () => this.subscribe();
      document.getElementById('unsubscribe-btn').onclick = () => this.unsubscribe();
    }
    async subscribe() {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return this.showStatus('Permission denied');
      const sub = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });
      await fetch(`${this.serverUrl}/api/subscribe`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub)
      });
      this.showStatus('Subscribed.');
    }
    async unsubscribe() {
      const sub = await this.swRegistration.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch(`${this.serverUrl}/api/unsubscribe`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint })
        });
      }
      this.showStatus('Unsubscribed.');
    }
    showStatus(msg) {
      document.getElementById('status').textContent = msg;
    }
    urlBase64ToUint8Array(base64) {
      const pad = '='.repeat((4 - base64.length % 4) % 4);
      const base64Str = (base64 + pad).replace(/\-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64Str);
      return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
    }
  }
  window.pushManager = new PushNotificationManager();
  