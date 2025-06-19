// Re-export Firebase services from the main firebase.ts file
// This avoids duplicate initialization errors

import { auth, db, googleProvider } from './firebase';

export { auth, db, googleProvider };

// This file exists for backward compatibility
// All Firebase initialization is now centralized in firebase.ts
