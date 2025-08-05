const subscribeBtn = document.getElementById('subscribe-btn');
const unsubscribeBtn = document.getElementById('unsubscribe-btn');
const sendBtn = document.getElementById('send-btn');
const statusDiv = document.getElementById('status');
const logDiv = document.getElementById('notification-log');

let swReg;
let userSubscription;

// ============ CONFIGURATION ============
const SERVER_ORIGIN = "http://localhost:3000"; // For localhost, leave ""; for remote, e.g. "https://your-server.com"
const PUBLIC_VAPID_KEY_ENDPOINT = SERVER_ORIGIN + "/api/vapid-public-key";
const SUBSCRIBE_ENDPOINT = SERVER_ORIGIN + "/api/subscribe";
const UNSUBSCRIBE_ENDPOINT = SERVER_ORIGIN + "/api/unsubscribe";
const SEND_ENDPOINT = SERVER_ORIGIN + "/api/send-notification";
const SERVICE_WORKER_PATH = "service-worker.js"; // Ensure this matches your server config
// =======================================

// Helper: Base64 VAPID key conversion
function urlBase64ToUint8Array(base64String) {
  try {
    console.log('Converting VAPID key:', base64String);
    
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const uint8Array = Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
    
    console.log('Key length:', uint8Array.length, 'bytes');
    console.log('First few bytes:', Array.from(uint8Array.slice(0, 5)));
    
    // Validate the key length (should be 65 bytes for VAPID public key)
    if (uint8Array.length !== 65) {
      console.warn(`Warning: VAPID key length is ${uint8Array.length} (expected 65)`);
      // Don't throw error, just warn - some browsers might accept different lengths
    }
    
    return uint8Array;
  } catch (error) {
    console.error('VAPID key conversion error:', error);
    throw new Error('Invalid VAPID key format: ' + error.message);
  }
}

function showStatus(msg, color='inherit') {
  statusDiv.textContent = msg;
  statusDiv.style.color = color;
}

function log(msg) {
  logDiv.textContent = msg;
}

function setUiSubscribed(isSubscribed) {
  subscribeBtn.disabled = isSubscribed;
  unsubscribeBtn.disabled = !isSubscribed;
  sendBtn.disabled = !isSubscribed;
}

async function registerServiceWorker() {
  try {
    if ('serviceWorker' in navigator) {
      swReg = await navigator.serviceWorker.register(SERVICE_WORKER_PATH);
      showStatus('✔ Service worker registered.', '#4b5563');
      navigator.serviceWorker.addEventListener('message', e => {
        log(`Service Worker: ${e.data}`);
      });
    } else {
      showStatus('Service Workers not supported', 'red');
    }
  } catch (error) {
    showStatus('Failed to register service worker: ' + error.message, 'red');
    console.error('Service worker registration failed:', error);
  }
}

async function fetchVAPIDKey() {
  try {
    console.log('Fetching VAPID key from:', PUBLIC_VAPID_KEY_ENDPOINT);
    const res = await fetch(PUBLIC_VAPID_KEY_ENDPOINT);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log('VAPID key response:', data);
    
    if (!data.publicKey) {
      throw new Error('No public key in response');
    }
    
    return data.publicKey;
  } catch (error) {
    console.error('Failed to fetch VAPID key:', error);
    throw error;
  }
}

async function subscribeUser() {
  try {
    // Check if service worker is registered
    if (!swReg) {
      showStatus('Service worker not registered. Please wait or refresh the page.', 'red');
      return;
    }

    // Test notification permissions first
    console.log('Testing notification permissions...');
    let permissionTest = await testNotificationPermission();
    
    if (!permissionTest) {
      console.log('🔄 Trying to force enable notifications...');
      permissionTest = await forceEnableNotifications();
      
      if (!permissionTest) {
        showStatus('Notification permissions blocked. Please enable in browser settings and refresh.', 'red');
        console.log('🔧 Quick Fix:');
        console.log('1. Click the lock icon in address bar');
        console.log('2. Set notifications to "Allow"');
        console.log('3. Refresh page');
        return;
      }
    }
    
    console.log('✅ Notification permissions are working');

    const vapidKey = await fetchVAPIDKey();
    console.log('VAPID Key received:', vapidKey);
    
    // Convert VAPID key to Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(vapidKey);
    console.log('Application server key length:', applicationServerKey.length);
    
    // Check for existing subscription and unsubscribe first
    const existingSubscription = await swReg.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('Found existing subscription, unsubscribing first...');
      await existingSubscription.unsubscribe();
    }
    
    // Try subscription with proper error handling
    let userSubscription = null;
    
    try {
      console.log('Attempting push subscription...');
      userSubscription = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
      console.log('✅ Push subscription successful');
    } catch (error) {
      console.error('❌ Push subscription failed:', error);
      
      // Check if it's a permission issue
      if (error.name === 'NotAllowedError' || error.message.includes('permission denied')) {
        console.log('🔧 Permission issue detected. Trying to fix...');
        
        // Try to re-enable permissions
        const permissionFixed = await forceEnableNotifications();
        if (permissionFixed) {
          console.log('🔄 Retrying subscription after permission fix...');
          userSubscription = await swReg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
          });
          console.log('✅ Subscription successful after permission fix');
        } else {
          throw new Error('Cannot enable notifications. Please check browser settings.');
        }
      } else {
        throw error;
      }
    }

    if (!userSubscription) {
      throw new Error('Failed to create subscription after multiple attempts');
    }

    console.log('Subscription created:', userSubscription);

    await fetch(SUBSCRIBE_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(userSubscription),
      headers: { 'Content-Type': 'application/json' }
    });
    showStatus('Subscribed! Ready to receive notifications.', 'green');
    setUiSubscribed(true);
  } catch (e) {
    console.error('Subscription error details:', e);
    showStatus('Error subscribing: ' + e.message, 'red');
  }
}

async function unsubscribeUser() {
  try {
    // Check if service worker is registered
    if (!swReg) {
      showStatus('Service worker not registered. Please wait or refresh the page.', 'red');
      return;
    }

    const sub = await swReg.pushManager.getSubscription();
    if (sub) {
      await fetch(UNSUBSCRIBE_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({ endpoint: sub.endpoint }),
        headers: { 'Content-Type': 'application/json' }
      });
      await sub.unsubscribe();
      showStatus('Unsubscribed.', 'orange');
      setUiSubscribed(false);
    }
  } catch (e) {
    showStatus('Error unsubscribing: ' + e, 'red');
  }
}

async function sendTestNotification() {
  try {
    await fetch(SEND_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Hello!',
        body: 'This is a push notification test.',
        url: '/'
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    log('Sent a test notification. Check your browser.');
  } catch (e) {
    log('Error sending notification: ' + e);
  }
}

async function checkSubscribed() {
  if (!swReg) {
    setUiSubscribed(false);
    return;
  }
  try {
    const sub = await swReg.pushManager.getSubscription();
    setUiSubscribed(!!sub);
  } catch (error) {
    console.error('Error checking subscription:', error);
    setUiSubscribed(false);
  }
}

subscribeBtn.onclick = subscribeUser;
unsubscribeBtn.onclick = unsubscribeUser;
sendBtn.onclick = sendTestNotification;

// Add test permission button to console for debugging
console.log('🔧 Debug Commands Available:');
console.log('- testNotificationPermission() - Test basic notifications');
console.log('- forceEnableNotifications() - Force enable notifications');
console.log('- resetNotificationPermissions() - Try to reset permissions');
console.log('- checkBrowserSupport() - Check browser capabilities');

// Diagnostic function to check browser support
function checkBrowserSupport() {
  console.log('=== Browser Support Check ===');
  console.log('Service Worker support:', 'serviceWorker' in navigator);
  console.log('Push Manager support:', 'pushManager' in ServiceWorkerRegistration.prototype);
  console.log('Notification support:', 'Notification' in window);
  console.log('Permission API support:', 'permissions' in navigator);
  console.log('Current protocol:', window.location.protocol);
  console.log('Current origin:', window.location.origin);
  console.log('Current notification permission:', Notification.permission);
  console.log('===========================');
}

// Function to help users enable notifications
function showNotificationHelp() {
  const helpText = `
🔔 Notification Permission Help:

1. Check your browser's notification settings:
   - Chrome: Settings > Privacy and security > Site Settings > Notifications
   - Firefox: Settings > Privacy & Security > Permissions > Notifications
   - Edge: Settings > Cookies and site permissions > Notifications

2. Make sure notifications are allowed for localhost:3000

3. If notifications are blocked, click "Allow" when prompted

4. Refresh the page and try subscribing again
  `;
  
  console.log(helpText);
  showStatus('Check browser console for notification help', 'orange');
}

// Function to test basic notification permissions
async function testNotificationPermission() {
  try {
    console.log('Testing notification permission...');
    console.log('Current permission status:', Notification.permission);
    
    if (Notification.permission === 'granted') {
      console.log('✅ Notifications are already granted');
      new Notification('Test Notification', {
        body: 'This is a test notification to verify permissions are working.',
        icon: '/icon-192x192.png'
      });
      return true;
    } else if (Notification.permission === 'denied') {
      console.log('❌ Notifications are denied');
      console.log('🔧 To fix this:');
      console.log('1. Click the lock/shield icon in the address bar');
      console.log('2. Set notifications to "Allow"');
      console.log('3. Refresh the page');
      showNotificationHelp();
      return false;
    } else {
      console.log('Requesting notification permission...');
      const permission = await Notification.requestPermission();
      console.log('Permission result:', permission);
      
      if (permission === 'granted') {
        console.log('✅ Permission granted, testing notification...');
        new Notification('Test Notification', {
          body: 'This is a test notification to verify permissions are working.',
          icon: '/icon-192x192.png'
        });
        return true;
      } else {
        console.log('❌ Permission denied');
        showNotificationHelp();
        return false;
      }
    }
  } catch (error) {
    console.error('Error testing notification permission:', error);
    return false;
  }
}

// Function to force enable notifications
async function forceEnableNotifications() {
  console.log('🔄 Attempting to force enable notifications...');
  
  // Try to request permission with a more direct approach
  try {
    // First, try to show a test notification to trigger permission request
    if (Notification.permission === 'default') {
      console.log('Showing test notification to trigger permission request...');
      new Notification('Permission Test', {
        body: 'This will help enable notifications',
        requireInteraction: true
      });
    }
    
    // Request permission explicitly
    const permission = await Notification.requestPermission();
    console.log('Permission result:', permission);
    
    if (permission === 'granted') {
      console.log('✅ Notifications enabled successfully!');
      return true;
    } else {
      console.log('❌ Still denied. Manual intervention required.');
      console.log('🔧 Manual Steps:');
      console.log('1. Close this browser tab');
      console.log('2. Open browser settings');
      console.log('3. Find "Notifications" or "Site Settings"');
      console.log('4. Allow notifications for localhost:3000');
      console.log('5. Reopen this page');
      return false;
    }
  } catch (error) {
    console.error('Error forcing notification enable:', error);
    return false;
  }
}

// Function to reset notification permissions (for testing)
async function resetNotificationPermissions() {
  console.log('🔄 Attempting to reset notification permissions...');
  
  // Try to request permission again
  try {
    const permission = await Notification.requestPermission();
    console.log('New permission status:', permission);
    
    if (permission === 'granted') {
      console.log('✅ Permissions reset successfully');
      return true;
    } else {
      console.log('❌ Still denied after reset attempt');
      return false;
    }
  } catch (error) {
    console.error('Error resetting permissions:', error);
    return false;
  }
}

// On Load
(async () => {
  checkBrowserSupport();
  await registerServiceWorker();
  await checkSubscribed();
})();
