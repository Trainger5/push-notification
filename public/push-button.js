// Push Notification Subscribe Button Component
// Easy-to-integrate, customizable button for push notifications
// Usage: <script src="push-button.js"></script>

(function() {
  // Default styles for the button
  const defaultStyles = `
    .pn-subscribe-button {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      text-decoration: none;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    
    .pn-subscribe-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
    }
    
    .pn-subscribe-button:active {
      transform: translateY(0);
    }
    
    .pn-subscribe-button.pn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .pn-subscribe-button.pn-success {
      background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
      color: #1a1a2e;
    }
    
    .pn-subscribe-button.pn-danger {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }
    
    .pn-subscribe-button.pn-dark {
      background: linear-gradient(135deg, #2e3442 0%, #1a1a2e 100%);
      color: white;
    }
    
    .pn-subscribe-button.pn-light {
      background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
      color: #333;
      border: 1px solid #e0e0e0;
    }
    
    .pn-subscribe-button.pn-gradient {
      background: linear-gradient(135deg, #FA8BFF 0%, #2BD2FF 52%, #2BFF88 90%);
      color: white;
      font-weight: 700;
    }
    
    .pn-subscribe-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
    }
    
    .pn-subscribe-button .pn-icon {
      width: 20px;
      height: 20px;
      display: inline-block;
      vertical-align: middle;
    }
    
    .pn-subscribe-button .pn-spinner {
      display: none;
      width: 16px;
      height: 16px;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: pn-spin 0.75s linear infinite;
    }
    
    .pn-subscribe-button.pn-loading .pn-spinner {
      display: inline-block;
    }
    
    .pn-subscribe-button.pn-loading .pn-icon {
      display: none;
    }
    
    @keyframes pn-spin {
      to { transform: rotate(360deg); }
    }
    
    .pn-subscribe-button .pn-ripple {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      transform: scale(0);
      animation: pn-ripple 0.6s ease-out;
    }
    
    @keyframes pn-ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
    
    /* Tooltip for status */
    .pn-button-wrapper {
      position: relative;
      display: inline-block;
    }
    
    .pn-tooltip {
      position: absolute;
      bottom: 125%;
      left: 50%;
      transform: translateX(-50%);
      background: #333;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s, visibility 0.3s;
      z-index: 1000;
      pointer-events: none;
    }
    
    .pn-tooltip::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 6px solid transparent;
      border-top-color: #333;
    }
    
    .pn-tooltip.pn-show {
      opacity: 1;
      visibility: visible;
    }
  `;
  
  // Bell icon SVG
  const bellIcon = `<svg class="pn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>`;
  
  // Check icon SVG
  const checkIcon = `<svg class="pn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>`;
  
  class PushNotificationButton {
    constructor(config = {}) {
      this.config = {
        selector: config.selector || '[data-push-button]',
        apiKey: config.apiKey || null,
        baseUrl: config.baseUrl || null,
        theme: config.theme || 'primary',
        subscribeText: config.subscribeText || 'Enable Notifications',
        subscribedText: config.subscribedText || 'Notifications Enabled',
        subscribingText: config.subscribingText || 'Enabling...',
        errorText: config.errorText || 'Error! Try again',
        onSuccess: config.onSuccess || null,
        onError: config.onError || null,
        showTooltip: config.showTooltip !== false,
        autoInit: config.autoInit !== false
      };
      
      this.buttons = [];
      this.isInitialized = false;
      
      if (this.config.autoInit) {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
          this.init();
        }
      }
    }
    
    async init() {
      // Inject styles
      if (!document.getElementById('pn-button-styles')) {
        const style = document.createElement('style');
        style.id = 'pn-button-styles';
        style.textContent = defaultStyles;
        document.head.appendChild(style);
      }
      
      // Initialize PN SDK if available
      if (window.PN && this.config.apiKey) {
        try {
          await window.PN.init({
            apiKey: this.config.apiKey,
            baseUrl: this.config.baseUrl
          });
          this.isInitialized = true;
        } catch (error) {
          console.error('Failed to initialize PN SDK:', error);
        }
      }
      
      // Find and setup buttons
      this.setupButtons();
    }
    
    setupButtons() {
      const elements = document.querySelectorAll(this.config.selector);
      
      elements.forEach(element => {
        // Skip if already initialized
        if (element.dataset.pnInitialized) return;
        
        const wrapper = document.createElement('div');
        wrapper.className = 'pn-button-wrapper';
        element.parentNode.insertBefore(wrapper, element);
        wrapper.appendChild(element);
        
        // Add tooltip
        if (this.config.showTooltip) {
          const tooltip = document.createElement('div');
          tooltip.className = 'pn-tooltip';
          wrapper.appendChild(tooltip);
        }
        
        // Style the button
        element.classList.add('pn-subscribe-button', `pn-${this.config.theme}`);
        
        // Set initial state
        this.updateButtonState(element, 'default');
        
        // Add click handler
        element.addEventListener('click', (e) => this.handleClick(e, element));
        
        // Add ripple effect
        element.addEventListener('click', (e) => this.createRipple(e, element));
        
        element.dataset.pnInitialized = 'true';
        this.buttons.push(element);
      });
      
      // Check initial subscription status
      this.checkStatus();
    }
    
    async checkStatus() {
      if (!window.PN || !this.isInitialized) return;
      
      try {
        const status = await window.PN.getSubscriptionStatus();
        this.buttons.forEach(button => {
          if (status.isSubscribed) {
            this.updateButtonState(button, 'subscribed');
          }
        });
      } catch (error) {
        console.error('Failed to check subscription status:', error);
      }
    }
    
    async handleClick(event, button) {
      event.preventDefault();
      
      if (button.disabled) return;
      
      if (!window.PN) {
        this.showTooltip(button, 'Push SDK not loaded');
        return;
      }
      
      if (!this.isInitialized) {
        this.showTooltip(button, 'SDK not initialized');
        return;
      }
      
      // Check current status
      const status = await window.PN.getSubscriptionStatus();
      
      if (status.isSubscribed) {
        // Already subscribed
        this.showTooltip(button, 'Already subscribed!');
        return;
      }
      
      // Start subscribing
      this.updateButtonState(button, 'loading');
      
      try {
        const result = await window.PN.subscribe();
        
        if (result.success) {
          this.updateButtonState(button, 'subscribed');
          this.showTooltip(button, 'Successfully subscribed!');
          
          if (this.config.onSuccess) {
            this.config.onSuccess(result);
          }
        }
      } catch (error) {
        this.updateButtonState(button, 'error');
        this.showTooltip(button, error.message || 'Subscription failed');
        
        if (this.config.onError) {
          this.config.onError(error);
        }
        
        // Reset to default after 3 seconds
        setTimeout(() => {
          this.updateButtonState(button, 'default');
        }, 3000);
      }
    }
    
    updateButtonState(button, state) {
      button.classList.remove('pn-loading');
      
      switch (state) {
        case 'loading':
          button.disabled = true;
          button.classList.add('pn-loading');
          button.innerHTML = `<span class="pn-spinner"></span> ${this.config.subscribingText}`;
          break;
        case 'subscribed':
          button.disabled = true;
          button.innerHTML = `${checkIcon} ${this.config.subscribedText}`;
          break;
        case 'error':
          button.disabled = false;
          button.innerHTML = `${bellIcon} ${this.config.errorText}`;
          break;
        default:
          button.disabled = false;
          button.innerHTML = `${bellIcon} ${this.config.subscribeText}`;
      }
    }
    
    showTooltip(button, message) {
      if (!this.config.showTooltip) return;
      
      const wrapper = button.closest('.pn-button-wrapper');
      const tooltip = wrapper?.querySelector('.pn-tooltip');
      
      if (tooltip) {
        tooltip.textContent = message;
        tooltip.classList.add('pn-show');
        
        setTimeout(() => {
          tooltip.classList.remove('pn-show');
        }, 3000);
      }
    }
    
    createRipple(event, button) {
      const ripple = document.createElement('span');
      ripple.className = 'pn-ripple';
      
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      
      button.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    }
  }
  
  // Auto-initialize with data attributes
  if (typeof window !== 'undefined') {
    window.PushNotificationButton = PushNotificationButton;
    
    // Auto-init if data-auto-init is present
    document.addEventListener('DOMContentLoaded', () => {
      const autoInitButtons = document.querySelectorAll('[data-push-button][data-auto-init]');
      if (autoInitButtons.length > 0) {
        const firstButton = autoInitButtons[0];
        new PushNotificationButton({
          apiKey: firstButton.dataset.apiKey,
          baseUrl: firstButton.dataset.baseUrl,
          theme: firstButton.dataset.theme || 'primary',
          subscribeText: firstButton.dataset.subscribeText,
          subscribedText: firstButton.dataset.subscribedText
        });
      }
    });
  }
})();