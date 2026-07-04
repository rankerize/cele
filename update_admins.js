require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}
const db = admin.firestore();
const auth = admin.auth();

async function updateAdmin(email) {
  try {
    const user = await auth.getUserByEmail(email);
    console.log('Found user:', user.uid);
    await db.collection('users').doc(user.uid).collection('credits').doc('balance').set({
      balance: 999999,
      wordsGenerated: 0,
      updatedAt: new Date().toISOString()
    });
    await db.collection('users').doc(user.uid).update({ role: 'admin' });
    console.log('Updated', email);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.log('User not found yet, skipping:', email);
    } else {
      console.error('Error with', email, err);
    }
  }
}

async function run() {
  await updateAdmin('rankerize@gmail.com');
  await updateAdmin('cesar.jimenez@rankerize.com');
  process.exit(0);
}
run();
