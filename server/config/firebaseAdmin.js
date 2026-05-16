const admin = require('firebase-admin');
const path = require('path');

const fs = require('fs');

// Initialize Firebase Admin with service account
let serviceAccountPath = path.join(__dirname, 'firebaseServiceAccount.json');

// Render places secret files in the root folder, so we add a fallback check
if (!fs.existsSync(serviceAccountPath)) {
  serviceAccountPath = path.join(__dirname, '..', 'firebaseServiceAccount.json');
}

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
