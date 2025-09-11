const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:4000/api';
const CUSTOMER_ID = 'f86693a9-a9bc-4024-b1cf-5c34b2700d67'; // Your customer ID from the logs

// Admin token - you'll need to get this from your admin login
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

async function fixVapidIssue() {
  try {
    if (!ADMIN_TOKEN) {
      console.log('Please set ADMIN_TOKEN environment variable');
      console.log('You can get this by logging in as admin and checking the network tab');
      return;
    }

    const headers = {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json'
    };

    console.log('Step 1: Clearing old subscriptions...');
    const clearSubsResponse = await axios.delete(
      `${API_BASE}/admin/customers/${CUSTOMER_ID}/subscriptions`,
      { headers }
    );
    console.log('Subscriptions cleared:', clearSubsResponse.data);

    console.log('\nStep 2: Clearing VAPID keys...');
    const clearVapidResponse = await axios.delete(
      `${API_BASE}/admin/customers/${CUSTOMER_ID}/vapid-keys`,
      { headers }
    );
    console.log('VAPID keys cleared:', clearVapidResponse.data);

    console.log('\n✅ Fix complete! Please:');
    console.log('1. Clear your browser cache/service worker');
    console.log('2. Re-visit the site to create a new subscription');
    console.log('3. Try sending a notification again');
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

fixVapidIssue();