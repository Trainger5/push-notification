// Push Notification Service Worker - Localhost Compatible Version
// For development use only

// Try to import from server, with fallback for localhost
try {
  // This will work when served from the same domain as the server
  importScripts('http://13.126.228.42/pn-sw.js');
} catch (e) {
  // Fallback service worker for localhost development
  console.log('Using localhost fallback service worker');
  
  self.addEventListener('push', function (event) {
    console.log('🔔 Service Worker: Push event received!', event);
    let payload = {};
    try {
      payload = event.data ? event.data.json() : {};
      console.log('📄 Service Worker: Payload received:', payload);
    } catch (e) {
      console.error('❌ Service Worker: Failed to parse payload:', e);
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
      icon: payload.icon || payload.iconUrl || undefined,
      badge: payload.badge || payload.badgeUrl || undefined,
      image: payload.image || undefined,
      data: { 
        url: payload.url || '/', 
        track: payload.track || null,
        customData: payload.data || {},
        timestamp: Date.now()
      },
      tag: payload.tag || undefined,
      renotify: payload.renotify || false,
      requireInteraction: payload.requireInteraction || false,
      timestamp: payload.timestamp ? new Date(payload.timestamp).getTime() : Date.now(),
      dir: payload.dir || 'auto',
      lang: payload.lang || 'en-US',
      vibrate: payload.vibrate || [200, 100, 200],
      sound: payload.sound || undefined
    };

    // Add action buttons if provided
    if (payload.actions && Array.isArray(payload.actions) && payload.actions.length > 0) {
      options.actions = payload.actions.map(action => ({
        action: action.action,
        title: action.title,
        icon: action.icon || undefined
      })).slice(0, 2);
    }

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  });

  // Enhanced notification click handler
  self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    
    const data = event.notification.data || {};
    const action = event.action;
    const customData = data.customData || {};
    
    let url = data.url || '/';

    // Handle action button clicks
    if (action) {
      url = customData[`${action}_url`] || customData.actionUrls?.[action] || url;
    }

    event.waitUntil(
      (async () => {
        try {
          const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
          
          // Try to focus existing tab with the same origin
          for (const client of clientList) {
            const clientUrl = new URL(client.url);
            const targetUrl = new URL(url, self.location.origin);
            
            if (clientUrl.origin === targetUrl.origin) {
              await client.navigate(url);
              return client.focus();
            }
          }
          
          // No existing tab found, open new window
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        } catch (e) {
          console.error('Failed to handle notification click navigation:', e);
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        }
      })()
    );
  });

  // Handle notification close events
  self.addEventListener('notificationclose', function (event) {
    const data = event.notification.data || {};
    console.log('Notification closed:', data);
  });

  // Handle installation
  self.addEventListener('install', function (event) {
    console.log('Push notification service worker installed (localhost version)');
    self.skipWaiting();
  });

  // Handle activation
  self.addEventListener('activate', function (event) {
    console.log('Push notification service worker activated (localhost version)');
    event.waitUntil(self.clients.claim());
  });
}