/* Default service worker for Web Push notifications.
   Copy this file to your website root as `/sw.js`.
*/
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  try {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Notification';
    const options = {
      body: data.body,
      icon: data.icon,
      image: data.image,
      badge: data.badge,
      tag: data.tag,
      data: data.data || {},
      actions: data.actions || []
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    // fallback if payload is not JSON
    event.waitUntil(self.registration.showNotification('Notification'));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url;
  if (!targetUrl) return;
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      let client = allClients.find((c) => c.url === targetUrl);
      if (client) {
        client.focus();
      } else {
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});


