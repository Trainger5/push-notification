// Enhanced push notification handler with rich media support
// Global configuration - can be updated via postMessage from SDK
let API_BASE_URL = '';

// Listen for configuration messages from SDK
self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'CONFIG') {
    API_BASE_URL = event.data.baseUrl || '';
    console.log('⚙️ Service Worker: Configuration received, baseUrl:', API_BASE_URL);
  }
});
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
    image: payload.image || undefined, // Large image for rich notifications
    data: {
      url: payload.url || '/',
      track: payload.track || null,
      customData: payload.data || {},
      timestamp: Date.now()
    },
    tag: payload.tag || undefined, // Group similar notifications
    renotify: payload.renotify || false,
    requireInteraction: payload.requireInteraction || false, // Persistent notification
    timestamp: payload.timestamp ? new Date(payload.timestamp).getTime() : Date.now(),
    dir: payload.dir || 'auto',
    lang: payload.lang || 'en-US',
    vibrate: payload.vibrate || [200, 100, 200], // Vibration pattern
    sound: payload.sound || undefined
  };

  // Add action buttons if provided
  if (payload.actions && Array.isArray(payload.actions) && payload.actions.length > 0) {
    options.actions = payload.actions.map(action => ({
      action: action.action,
      title: action.title,
      icon: action.icon || undefined
    })).slice(0, 2); // Limit to 2 actions for compatibility
  }

  // Track notification show event
  event.waitUntil(
    (async () => {
      // Track notification display - use configured base URL
      const openUrl = payload.track && payload.track.openUrl ?
        (API_BASE_URL ? API_BASE_URL + payload.track.openUrl : payload.track.openUrl) : null;
      if (openUrl) {
        try {
          await fetch(openUrl, { method: 'POST' });
        } catch (e) {
          console.error('Failed to track notification open:', e);
        }
      }

      // Show the notification
      console.log('✅ Service Worker: Showing notification:', title, options);
      const result = await self.registration.showNotification(title, options);
      console.log('🎉 Service Worker: Notification shown successfully');
      return result;
    })()
  );
});

// Enhanced notification click handler with action support
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const data = event.notification.data || {};
  const action = event.action; // Which action button was clicked (if any)
  const customData = data.customData || {};

  let url = data.url || '/';
  let trackingType = 'click';

  // Handle action button clicks
  if (action) {
    const actionConfig = event.notification.actions.find(a => a.action === action);
    if (actionConfig) {
      // Action-specific URL if defined in custom data
      url = customData[`${action}_url`] || customData.actionUrls?.[action] || url;
      trackingType = `action_${action}`;
    }
  }

  event.waitUntil(
    (async () => {
      // Track the click/action event - use configured base URL
      const clickUrl = data.track && data.track.clickUrl ?
        (API_BASE_URL ? API_BASE_URL + data.track.clickUrl : data.track.clickUrl) + `&action=${encodeURIComponent(action || 'default')}` : null;

      if (clickUrl) {
        try {
          await fetch(clickUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: action || 'click',
              timestamp: Date.now(),
              customData: customData
            })
          });
        } catch (e) {
          console.error('Failed to track notification click:', e);
        }
      }

      // Handle the navigation
      try {
        const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });

        // Try to focus existing tab with the same origin
        for (const client of clientList) {
          const clientUrl = new URL(client.url);
          const targetUrl = new URL(url, self.location.origin);

          if (clientUrl.origin === targetUrl.origin) {
            // Navigate existing tab and focus it
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
        // Fallback - try to open window anyway
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      }
    })()
  );
});

// Handle notification close events (user dismissed without clicking)
self.addEventListener('notificationclose', function (event) {
  const data = event.notification.data || {};

  // Track notification dismissal
  if (data.track && data.track.dismissUrl) {
    fetch(data.track.dismissUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'dismiss',
        timestamp: Date.now()
      })
    }).catch(e => console.error('Failed to track notification dismiss:', e));
  }
});

// Handle background sync for offline notification delivery
self.addEventListener('sync', function (event) {
  if (event.tag === 'push-notification-retry') {
    event.waitUntil(
      // Retry failed notification deliveries
      retryFailedNotifications()
    );
  }
});

// Handle background fetch for large image preloading
self.addEventListener('backgroundfetch', function (event) {
  if (event.tag === 'notification-media') {
    event.waitUntil(
      preloadNotificationMedia(event)
    );
  }
});

// Handle installation with cache setup
const CACHE_VERSION = 'pn-v1';
const CACHE_NAME = `push-notifications-${CACHE_VERSION}`;

self.addEventListener('install', function (event) {
  console.log('📦 Service Worker: Installing version', CACHE_VERSION);

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('✅ Service Worker: Cache opened');
      // No static assets to cache for push notifications
      // Cache is primarily for offline configuration
      return Promise.resolve();
    }).then(() => {
      // Skip waiting to activate immediately
      return self.skipWaiting();
    })
  );
});

// Handle activation with cache cleanup
self.addEventListener('activate', function (event) {
  console.log('⚙️ Service Worker: Activating version', CACHE_VERSION);

  event.waitUntil(
    // Clean up old caches
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            // Delete caches that don't match our current version
            return cacheName.startsWith('push-notifications-') && cacheName !== CACHE_NAME;
          })
          .map(cacheName => {
            console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    }).then(() => {
      console.log('✅ Service Worker: Activated and controlling all clients');
    })
  );
});


