const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin with service account
const serviceAccountPath = path.join(__dirname, 'firebaseServiceAccount.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('🔥 Firebase Admin initialized');
} catch (error) {
  console.error('❌ Firebase Admin init failed. Make sure server/config/firebaseServiceAccount.json exists.');
  console.error(error.message);
}

module.exports = admin;
