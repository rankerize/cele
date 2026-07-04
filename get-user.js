const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const app = initializeApp();
const db = getFirestore();
const auth = getAuth();

async function main() {
  try {
    const userRecord = await auth.getUserByEmail('rankerize@gmail.com');
    console.log('Firebase UID:', userRecord.uid);
    
    const doc = await db.collection('users').doc(userRecord.uid).get();
    if (!doc.exists) {
      console.log('No user doc with Firebase UID.');
    } else {
      console.log('User Doc:', doc.data());
    }

    // Also try finding by email
    const snapshot = await db.collection('users').where('email', '==', 'rankerize@gmail.com').get();
    snapshot.forEach(d => {
        console.log('Doc found by email, ID:', d.id);
        console.log('Data:', d.data());
    });

  } catch (e) {
    console.error(e);
  }
}
main();
