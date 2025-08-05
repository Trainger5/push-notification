const webpush = require('web-push');
const fs = require('fs');
const vapidKeys = webpush.generateVAPIDKeys();
console.log('🔑 VAPID Public Key:', vapidKeys.publicKey);
console.log('🔑 VAPID Private Key:', vapidKeys.privateKey);
fs.writeFileSync('.env',
  `VAPID_PUBLIC_KEY=${vapidKeys.publicKey}\nVAPID_PRIVATE_KEY=${vapidKeys.privateKey}\nPORT=3000\n`
);
console.log('✅ .env file created with keys.');
