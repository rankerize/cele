import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCA4-TcIIoXKmxXKmDC5asCkHePWG8slbs",
  authDomain: "rankerize-flow-app.firebaseapp.com",
  projectId: "rankerize-flow-app",
  storageBucket: "rankerize-flow-app.firebasestorage.app",
  messagingSenderId: "122317666299",
  appId: "1:122317666299:web:90bc665e7742a49189bd5e"
};

console.log("Testing with manual config...");

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testAuth() {
  try {
    console.log("Attempting to sign in with rankerize@gmail.com / Celeste.01 ...");
    await signInWithEmailAndPassword(auth, "rankerize@gmail.com", "Celeste.01");
    console.log("Success!");
  } catch (error: any) {
    console.error("Auth Error Code:", error.code);
    console.error("Auth Error Message:", error.message);
  }
}

testAuth();
