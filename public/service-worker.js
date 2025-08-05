self.addEventListener('push', event => {
    let data = event.data ? event.data.json() : {};
    event.waitUntil(
      self.registration.showNotification(
        data.title || "Push Notification",
        {
          body: data.body,
          icon: data.icon || '/icon-192x192.png',
          data: { url: data.url }
        }
      )
    );
  });
  
  self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
      clients.openWindow(event.notification.data ? event.notification.data.url || "/" : "/")
    );
  });
  