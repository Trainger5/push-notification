// Enhanced push notification handler with rich media support
// Dynamically determine the base API URL
const getBaseApiUrl = () => {
  // Try to get from registration scope or use current origin
  if (self.registration && self.registration.scope) {
    try {
      const scopeUrl = new URL(self.registration.scope);
      return scopeUrl.origin;
    } catch (e) {
      // Fallback to self.location if available
    }
  }
  
  // Fallback - try to determine from current location
  if (self.location && self.location.origin) {
    return self.location.origin;
  }
  
  // Final fallback - assume same origin as service worker
  return '';
};

const API_BASE_URL = getBaseApiUrl();

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
      // Track notification display
      const openUrl = payload.track && payload.track.openUrl ? 
        API_BASE_URL + payload.track.openUrl : null;
      if (openUrl) {
        try { 
          await fetch(openUrl, { method: 'POST' }); 
        } catch (e) {
          console.error('Failed to track notification open:', e);
        }
      }

      // Show the notification
      return self.registration.showNotification(title, options);
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
  if (action && Array.isArray(event.notification.actions)) {
    const actionConfig = event.notification.actions.find(a => a.action === action);
    if (actionConfig) {
      // Action-specific URL if defined in custom data
      url = customData[`${action}_url`] || customData.actionUrls?.[action] || url;
      trackingType = `action_${action}`;
    }
  }

  event.waitUntil(
    (async () => {
      // Track the click/action event
      const clickUrl = data.track && data.track.clickUrl ? 
        API_BASE_URL + data.track.clickUrl + `&action=${encodeURIComponent(action || 'default')}` : null;
      
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
    fetch(API_BASE_URL + data.track.dismissUrl, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'dismiss',
        timestamp: Date.now()
      })
    }).catch(e => console.error('Failed to track notification dismiss:', e));
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
    // Fetch any pending notifications from the server
    const response = await fetch(`${API_BASE_URL}/api/notifications/pending`);
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
