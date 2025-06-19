import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  User 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';

export const registerWithEmail = async (email: string, password: string, displayName: string) => {
  try {
    // First create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    try {
      // Then create user document in Firestore with proper error handling
      await setDoc(doc(db, 'users', user.uid), {
        settings: {
          username: displayName,
          aiReviewer: 'both',
          createdAt: new Date().toISOString()
        },
        // Add default user data structure
        progress: {},
        submissions: [],
        sessions: [],
        exams: []
      });
      
      console.log('User document created successfully');
    } catch (firestoreError) {
      console.error('Error creating user document:', firestoreError);
      // Continue even if Firestore document creation fails
      // The user is still authenticated and can use the app
    }
    
    return user;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  try {
    // First authenticate with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    try {
      // Then fetch user settings from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      // If user document doesn't exist in Firestore, create it
      if (!userDoc.exists()) {
        console.log('User document not found, creating default document');
        await setDoc(doc(db, 'users', user.uid), {
          settings: {
            username: user.displayName || email.split('@')[0],
            aiReviewer: 'both',
            createdAt: new Date().toISOString()
          },
          progress: {},
          submissions: [],
          sessions: [],
          exams: []
        });
      }
    } catch (firestoreError) {
      // Log the error but don't fail the login process
      console.error('Error accessing Firestore during login:', firestoreError);
      // Continue with login even if Firestore access fails
    }
    
    return user;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    try {
      // Check if user document exists, create if not
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        console.log('Google user document not found, creating default document');
        await setDoc(doc(db, 'users', user.uid), {
          settings: {
            username: user.displayName || 'User',
            aiReviewer: 'both',
            createdAt: new Date().toISOString()
          },
          progress: {},
          submissions: [],
          sessions: [],
          exams: []
        });
      }
    } catch (firestoreError) {
      // Log the error but don't fail the login process
      console.error('Error accessing Firestore during Google login:', firestoreError);
      // Continue with login even if Firestore access fails
    }
    
    return user;
  } catch (error) {
    console.error('Error logging in with Google:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });
};
