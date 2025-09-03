// Push notification service worker for localhost testing
// This proxies to the main server at http://13.126.228.42

self.addEventListener('push', function (event) {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = {};
  }

  // Handle silent notifications (for badge updates, background data sync)
  if (payload.silent) {
    if (payload.badge !== undefined) {
      // Update application badge
      if (self.navigator && self.navigator.setAppBadge) {
        self.navigator.setAppBadge(payload.badge);
      }
    }
    return;
  }

  const title = payload.title || 'Notification';
  const options = {
    body: payload.body || '',
    icon: payload.icon || null,
    badge: payload.badge || null,
    image: payload.image || null,
    tag: payload.tag || 'default',
    data: {
      url: payload.url || null,
      clickAction: payload.clickAction || 'open_url',
      notificationId: payload.notificationId || null,
      customData: payload.data || null,
      serverUrl: 'http://13.126.228.42' // Track the server for analytics
    },
    requireInteraction: payload.requireInteraction || false,
    silent: payload.silent || false,
    actions: payload.actions || []
  };

  // Show notification
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click events
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const data = event.notification.data || {};
  const url = data.url;
  const clickAction = data.clickAction || 'open_url';
  const serverUrl = data.serverUrl || 'http://13.126.228.42';

  // Send analytics to the server
  if (data.notificationId) {
    fetch(`${serverUrl}/api/metrics/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: data.notificationId,
        clickedAt: new Date().toISOString()
      })
    }).catch(() => {}); // Silent fail for analytics
  }

  // Handle different click actions
  switch (clickAction) {
    case 'open_url':
      if (url) {
        event.waitUntil(clients.openWindow(url));
      }
      break;
    case 'focus_last':
      event.waitUntil(
        clients.matchAll().then(function (clientList) {
          if (clientList.length > 0) {
            return clientList[0].focus();
          }
          return clients.openWindow('/');
        })
      );
      break;
    case 'close':
      // Just close, no action needed
      break;
    default:
      if (url) {
        event.waitUntil(clients.openWindow(url));
      }
  }
});

// Handle notification close events
self.addEventListener('notificationclose', function (event) {
  const data = event.notification.data || {};
  const serverUrl = data.serverUrl || 'http://13.126.228.42';
  
  // Send analytics to the server
  if (data.notificationId) {
    fetch(`${serverUrl}/api/metrics/dismiss`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: data.notificationId,
        dismissedAt: new Date().toISOString()
      })
    }).catch(() => {}); // Silent fail for analytics
  }
});

// Handle background sync for offline notifications
self.addEventListener('sync', function (event) {
  if (event.tag === 'background-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  try {
    const serverUrl = 'http://13.126.228.42';
    // Fetch any pending notifications from the server
    const response = await fetch(`${serverUrl}/api/notifications/pending`);
    const notifications = await response.json();
    
    for (const notification of notifications) {
      await self.registration.showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon,
        data: notification.data
      });
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

// Handle installation
self.addEventListener('install', function (event) {
  console.log('Push notification service worker installed');
  self.skipWaiting();
});

// Handle activation
self.addEventListener('activate', function (event) {
  console.log('Push notification service worker activated');
  event.waitUntil(self.clients.claim());
});