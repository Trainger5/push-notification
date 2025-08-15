self.addEventListener('push', function (event) {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = {};
  }
  const title = payload.title || 'Notification';
  const options = {
    body: payload.body || '',
    icon: payload.iconUrl || undefined,
    badge: payload.badgeUrl || undefined,
    data: { url: payload.url || '/', track: payload.track || null }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const data = event.notification.data || {};
  const url = data.url || '/';
  const clickUrl = data.track && data.track.clickUrl ? data.track.clickUrl : null;
  event.waitUntil(
    (async () => {
      if (clickUrl) {
        try { await fetch(clickUrl, { method: 'POST' }); } catch (e) {}
      }
      const list = await clients.matchAll({ type: 'window' });
      for (const client of list) { if ('focus' in client) return client.focus(); }
      if (clients.openWindow) return clients.openWindow(url);
      return undefined;
    })()
  );
});


