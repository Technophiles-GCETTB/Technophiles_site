/**
 * Run this script once to generate VAPID keys for push notifications.
 * Usage: node scripts/generate-vapid-keys.js
 * Then copy the output into your .env file.
 */

try {
  const webpush = require('web-push');
  const keys = webpush.generateVAPIDKeys();
  
  console.log('\n✅ VAPID Keys Generated!\n');
  console.log('Add these to your .env file:\n');
  console.log(`PUBLIC_VAPID_KEY=${keys.publicKey}`);
  console.log(`PRIVATE_VAPID_KEY=${keys.privateKey}`);
  console.log('\n⚠️  IMPORTANT:');
  console.log('  - Keep PRIVATE_VAPID_KEY secret — never commit to git');
  console.log('  - PUBLIC_VAPID_KEY is safe to expose in frontend code');
  console.log('  - These keys are permanent — regenerating them will invalidate all existing subscriptions');
  console.log('  - Set VAPID_EMAIL to your admin email (e.g. mailto:admin@gcettb.ac.in)\n');
} catch (err) {
  if (err.code === 'MODULE_NOT_FOUND') {
    console.error('\n❌ web-push not installed. Run: npm install\n');
  } else {
    console.error('\n❌ Error:', err.message, '\n');
  }
  process.exit(1);
}
