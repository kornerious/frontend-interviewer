import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Use hardcoded values for development to ensure proper configuration
const firebaseConfig = {
  apiKey: "AIzaSyD33KZogkjUhFgkXgm1B2s8xzCWMyVH0eQ",
  authDomain: "frontendinterviewer.firebaseapp.com",
  databaseURL: "https://frontendinterviewer-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "frontendinterviewer",
  storageBucket: "frontendinterviewer.appspot.com",
  messagingSenderId: "203914945813",
  appId: "1:203914945813:web:d69ebc950393329ee0f51c",
  measurementId: "G-T2J7ZZ408S"
};

// Validate required config values
const validateConfig = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId'] as const;
  type RequiredField = typeof requiredFields[number];
  
  const missingFields = requiredFields.filter(
    (field: RequiredField) => !firebaseConfig[field]
  );
  
  if (missingFields.length > 0) {
    console.error(`Firebase initialization error: Missing required fields: ${missingFields.join(', ')}`);
    return false;
  }
  return true;
};

// Initialize Firebase with proper typing
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let googleProvider: GoogleAuthProvider;

try {
  if (validateConfig()) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    
    // Configure Google provider
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    console.log('Firebase initialized successfully');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { auth, db, googleProvider };
