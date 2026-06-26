import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app, auth, googleProvider, db, firestore;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  db = getDatabase(app);
  firestore = getFirestore(app);
} catch (e) {
  console.warn('Firebase initialization failed — using demo mode:', e.message);
}

// Check AFTER initialization so `auth` is defined when this runs
export const isFirebaseConfigured = () => {
  const key = import.meta.env.VITE_FIREBASE_API_KEY;
  const keyValid = key && key !== 'demo-key' && key !== 'your_api_key_here' && key.length > 10;
  return !!(keyValid && auth);
};

// Pre-computed stable flag — evaluated once at module load time (after init)
export const FIREBASE_CONFIGURED = (() => {
  const key = import.meta.env.VITE_FIREBASE_API_KEY;
  const keyValid = key && key !== 'demo-key' && key !== 'your_api_key_here' && key.length > 10;
  return !!(keyValid && auth);
})();

export { auth, googleProvider, db, firestore };
export default app;
