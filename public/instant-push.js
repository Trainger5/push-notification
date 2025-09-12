// Instant Push Notification Integration - One Line Solution
// Just include this script with your API key and you're done!

(function() {
  // Get API key from script tag
  const currentScript = document.currentScript;
  const apiKey = currentScript?.dataset?.apiKey;
  const autoInit = currentScript?.dataset?.autoInit !== 'false';
  
  if (!apiKey) {
    console.error('[PushAds123] Missing data-api-key attribute on script tag');
    return;
  }
  
  // Default button HTML if no button exists
  const defaultButtonHTML = `
    <button 
      id="pushads123-button"
      style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 14px 24px;
        border: none;
        border-radius: 50px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        transition: all 0.3s ease;
        z-index: 999999;
      "
      onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(102, 126, 234, 0.5)'"
      onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(102, 126, 234, 0.4)'"
    >
      🔔 Enable Notifications
    </button>
  `;
  
  // Load required scripts
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  // Initialize everything
  async function init() {
    try {
      // Load SDK if not already loaded
      if (!window.PN) {
        await loadScript('https://pushads123.com/sdk.js');
      }
      
      // Load button component if not already loaded
      if (!window.PushNotificationButton) {
        await loadScript('https://pushads123.com/push-button.js');
      }
      
      // Initialize SDK
      await window.PN.init({
        apiKey: apiKey,
        baseUrl: 'https://pushads123.com'
      });
      
      // Check if a button with data-push-button exists
      let button = document.querySelector('[data-push-button]');
      
      // If no button exists, create a default floating button
      if (!button) {
        const container = document.createElement('div');
        container.innerHTML = defaultButtonHTML;
        document.body.appendChild(container);
        button = document.getElementById('pushads123-button');
        
        // Set up click handler for default button
        button.addEventListener('click', async function() {
          try {
            this.disabled = true;
            this.innerHTML = '⏳ Enabling...';
            
            const result = await window.PN.subscribe();
            
            if (result.success) {
              this.innerHTML = '✅ Notifications Enabled';
              this.style.background = 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)';
              
              // Hide button after 3 seconds
              setTimeout(() => {
                this.style.opacity = '0';
                setTimeout(() => {
                  this.remove();
                }, 300);
              }, 3000);
            }
          } catch (error) {
            this.innerHTML = '❌ ' + (error.message || 'Failed');
            this.disabled = false;
            this.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
            
            setTimeout(() => {
              this.innerHTML = '🔔 Enable Notifications';
              this.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            }, 3000);
          }
        });
      } else {
        // Initialize existing button with component
        new window.PushNotificationButton({
          apiKey: apiKey,
          baseUrl: 'https://pushads123.com',
          theme: button.dataset.theme || 'gradient',
          subscribeText: button.dataset.subscribeText || '🔔 Enable Notifications',
          subscribedText: button.dataset.subscribedText || '✅ Notifications Enabled',
          autoInit: true
        });
      }
      
      // Check if already subscribed
      const status = await window.PN.getSubscriptionStatus();
      if (status.isSubscribed && button) {
        button.innerHTML = '✅ Already Subscribed';
        button.disabled = true;
        if (button.id === 'pushads123-button') {
          button.style.background = 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)';
          setTimeout(() => {
            button.style.opacity = '0';
            setTimeout(() => {
              button.remove();
            }, 300);
          }, 2000);
        }
      }
      
    } catch (error) {
      console.error('[PushAds123] Initialization failed:', error);
    }
  }
  
  // Auto-initialize if enabled
  if (autoInit) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
  
  // Expose init function for manual initialization
  window.PushAds123 = { init };
})();