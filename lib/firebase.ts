import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'placeholder-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'placeholder.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'placeholder-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:000000000000:web:placeholder'
};

// Initialize Firebase only once
const appAlreadyExisted = getApps().length > 0;
const app = appAlreadyExisted ? getApp() : initializeApp(firebaseConfig);

// Si la app ya existía, Firestore ya fue configurado: usar getFirestore.
// Si es la primera vez en el servidor, forzamos Long Polling para evitar cuelgues en Node.js.
const db = (!appAlreadyExisted && typeof window === 'undefined')
  ? initializeFirestore(app, { experimentalForceLongPolling: true })
  : getFirestore(app);

const auth = getAuth(app);

export { app, db, auth };
