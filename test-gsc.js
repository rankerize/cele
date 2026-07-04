const admin = require('firebase-admin');
const { google } = require('googleapis');

// Initialize Firebase Admin (assuming credentials are set or application default)
const serviceAccount = require('./firebase-service-account.json'); // I need to see if there is one

if (!serviceAccount) {
    console.error('No service account');
}
