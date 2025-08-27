# Push Notification Test Site

A comprehensive testing interface for the Push Notification System.

## Features

- 🚀 **Easy Setup** - Simple interface to test push notifications
- 🔔 **Real-time Status** - Live status indicators for all components
- 📤 **Test Notifications** - Send single or bulk test notifications
- 📝 **Debug Console** - Real-time logging of all operations
- 💾 **Configuration Persistence** - Saves your API key and server URL
- 🎨 **Beautiful UI** - Modern, responsive design

## Quick Start

1. **Install dependencies:**
   ```bash
   cd test-site
   npm install
   ```

2. **Start the test server:**
   ```bash
   npm start
   ```

3. **Open the test site:**
   - Navigate to http://localhost:3000

4. **Configure and test:**
   - Enter your API key from the dashboard
   - Make sure backend server is running at http://localhost:4000
   - Click "Initialize Push System"
   - Click "Subscribe to Notifications"
   - Send test notifications!

## Test Site Interface

### Status Indicators
- **Connection Status**: Shows if SDK is connected to server
- **Permission Status**: Browser notification permission state
- **Subscription Status**: Push subscription state
- **Service Worker**: Service worker registration status

### Configuration Section
- **API Key**: Your customer API key
- **Server URL**: Backend server URL (default: http://localhost:4000)

### Actions
- **Initialize**: Loads SDK and establishes connection
- **Subscribe**: Requests permission and subscribes to push
- **Unsubscribe**: Removes push subscription
- **Send Test**: Sends a single test notification
- **Send 5 Tests**: Sends multiple notifications for testing

### Debug Console
Real-time log of all operations with timestamps and color-coded messages:
- 🔵 Info messages
- 🟢 Success messages
- 🔴 Error messages

## Testing Workflow

1. **Setup Backend**
   ```bash
   cd backend
   npm run dev
   ```

2. **Get API Key**
   - Login to admin dashboard
   - Create a customer account
   - Copy the API key

3. **Start Test Site**
   ```bash
   cd test-site
   npm start
   ```

4. **Test Push Notifications**
   - Enter API key in test site
   - Initialize and subscribe
   - Send test notifications
   - Check browser notifications

## Troubleshooting

### Notifications not showing?
- Check browser notification permissions
- Ensure backend server is running
- Verify API key is correct
- Check console for errors

### Service Worker issues?
- Clear browser cache
- Check if running on HTTPS or localhost
- Verify service worker file is accessible

### Connection errors?
- Confirm backend is running on correct port
- Check CORS settings
- Verify network connectivity

## Browser Support

✅ **Supported Browsers:**
- Chrome/Edge (v42+)
- Firefox (v44+)
- Safari (v16+)
- Opera (v30+)

❌ **Not Supported:**
- Internet Explorer
- Older mobile browsers

## Security Notes

- Only use test site in development
- Never expose API keys in production
- Always use HTTPS in production environments
- Test site has CORS enabled for development only