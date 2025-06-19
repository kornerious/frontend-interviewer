import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';
import type { UserSettings, UserSubmission, MockExam } from '@/types';

// User settings
export const getUserSettings = async (uid: string): Promise<UserSettings> => {
  try {
    // Get the main user document which contains settings
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists() && docSnap.data().settings) {
      return docSnap.data().settings as UserSettings;
    } else {
      // Create default settings if they don't exist
      const defaultSettings: UserSettings = {
        username: 'User',
        aiReviewer: 'both',
        createdAt: new Date().toISOString()
      };
      
      // Update the main user document with settings
      await updateDoc(docRef, { settings: defaultSettings });
      return defaultSettings;
    }
  } catch (error) {
    console.error('Error getting user settings:', error);
    throw error;
  }
};

export const updateUserSettings = async (uid: string, settings: UserSettings): Promise<void> => {
  console.log('Starting updateUserSettings with uid:', uid);
  console.log('Current auth state:', auth.currentUser?.uid);
  
  if (!uid) {
    console.error('ERROR: No UID provided to updateUserSettings');
    throw new Error('No UID provided');
  }
  
  if (!auth.currentUser) {
    console.error('ERROR: No authenticated user found when updating settings');
    throw new Error('User not authenticated');
  }
  
  if (auth.currentUser.uid !== uid) {
    console.error(`ERROR: UID mismatch. Provided: ${uid}, Current: ${auth.currentUser.uid}`);
    throw new Error('UID mismatch');
  }
  
  try {
    // Reference to the user document
    const docRef = doc(db, 'users', uid);
    console.log('Document reference created for path:', `users/${uid}`);
    
    // Check if the document exists first
    console.log('Checking if document exists...');
    const docSnap = await getDoc(docRef);
    console.log('Document exists:', docSnap.exists());
    
    // Add timestamp to settings
    const updatedSettings = {
      ...settings,
      updatedAt: new Date().toISOString()
    };
    
    console.log('Updating user settings for uid:', uid);
    console.log('Settings data:', JSON.stringify(updatedSettings));
    
    if (docSnap.exists()) {
      // Document exists, update it
      console.log('Document exists, updating settings field');
      try {
        await updateDoc(docRef, { settings: updatedSettings });
        console.log('Settings updated successfully');
      } catch (updateError: any) {
        console.error('ERROR updating document:', updateError.code, updateError.message);
        throw updateError;
      }
    } else {
      // Document doesn't exist, create it
      console.log('Document does not exist, creating new document');
      try {
        await setDoc(docRef, {
          settings: updatedSettings,
          progress: {},
          submissions: [],
          sessions: [],
          exams: []
        });
        console.log('New document created successfully with settings');
      } catch (setError: any) {
        console.error('ERROR creating document:', setError.code, setError.message);
        throw setError;
      }
    }
  } catch (error: any) {
    console.error('Error in updateUserSettings:', error.code, error.message);
    console.error('Error details:', error);
    throw error;
  }
};

// Progress tracking
export const updateItemProgress = async (uid: string, itemId: string, itemType: 'theory' | 'question' | 'task', status: 'pending' | 'complete' | 'irrelevant') => {
  try {
    const docRef = doc(db, 'users', uid, 'progress', itemId);
    await setDoc(docRef, {
      itemType,
      status,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating item progress:', error);
    throw error;
  }
};

export const getItemProgress = async (uid: string, itemId: string) => {
  try {
    const docRef = doc(db, 'users', uid, 'progress', itemId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting item progress:', error);
    throw error;
  }
};

export const getAllProgress = async (uid: string): Promise<{ completedItems: Record<string, boolean>, incorrectItems: Record<string, boolean> }> => {
  try {
    const progressRef = collection(db, 'users', uid, 'progress');
    const querySnapshot = await getDocs(progressRef);
    
    const completedItems: Record<string, boolean> = {};
    const incorrectItems: Record<string, boolean> = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.status === 'complete') {
        completedItems[doc.id] = true;
      }
      if (data.result === 'fail') {
        incorrectItems[doc.id] = true;
      }
    });
    
    return { completedItems, incorrectItems };
  } catch (error) {
    console.error('Error getting all progress:', error);
    throw error;
  }
};

// Code submissions
export const saveSubmission = async (uid: string, taskId: string, code: string, result: 'pass' | 'fail', aiFeedback: string): Promise<void> => {
  try {
    const submissionsRef = collection(db, 'users', uid, 'submissions');
    await addDoc(submissionsRef, {
      taskId,
      code,
      result,
      aiFeedback,
      createdAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error saving submission:', error);
    throw error;
  }
};

export const getSubmissions = async (uid: string, taskId: string): Promise<UserSubmission[]> => {
  try {
    const submissionsRef = collection(db, 'users', uid, 'submissions');
    const q = query(submissionsRef, where('taskId', '==', taskId));
    const querySnapshot = await getDocs(q);
    
    const submissions: UserSubmission[] = [];
    querySnapshot.forEach((doc) => {
      submissions.push({
        id: doc.id,
        itemId: doc.data().taskId,
        userId: uid,
        content: doc.data().code,
        result: doc.data().result,
        feedback: doc.data().aiFeedback,
        timestamp: doc.data().createdAt.toDate().toISOString()
      });
    });
    
    return submissions;
  } catch (error) {
    console.error('Error getting submissions:', error);
    throw error;
  }
};

// Mock exams
export const createMockExam = async (uid: string, examData: Partial<MockExam>): Promise<string> => {
  try {
    const examsRef = collection(db, 'users', uid, 'exams');
    const docRef = await addDoc(examsRef, {
      ...examData,
      userId: uid,
      completed: false,
      score: 0,
      totalPoints: 0,
      startedAt: Timestamp.now(),
      currentItemIndex: 0
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating mock exam:', error);
    throw error;
  }
};

export const getMockExams = async (uid: string): Promise<MockExam[]> => {
  try {
    const examsRef = collection(db, 'users', uid, 'exams');
    const querySnapshot = await getDocs(examsRef);
    
    const exams: MockExam[] = [];
    querySnapshot.forEach((doc) => {
      exams.push({
        ...doc.data(),
        id: doc.id
      } as MockExam);
    });
    
    return exams;
  } catch (error) {
    console.error('Error getting mock exams:', error);
    throw error;
  }
};

export const updateMockExam = async (uid: string, examId: string, examData: Partial<MockExam>): Promise<void> => {
  try {
    const examRef = doc(db, 'users', uid, 'exams', examId);
    await updateDoc(examRef, examData);
  } catch (error) {
    console.error('Error updating mock exam:', error);
    throw error;
  }
};

export const submitMockExam = async (uid: string, examId: string, examData: Partial<MockExam>): Promise<void> => {
  try {
    const examRef = doc(db, 'users', uid, 'exams', examId);
    await updateDoc(examRef, {
      ...examData,
      completed: true,
      completedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error submitting mock exam:', error);
    throw error;
  }
};

export const completeMockExam = async (uid: string, examId: string, score: number, totalPoints: number): Promise<void> => {
  try {
    const examRef = doc(db, 'users', uid, 'exams', examId);
    await updateDoc(examRef, {
      completed: true,
      completedAt: Timestamp.now(),
      score,
      totalPoints
    });
  } catch (error) {
    console.error('Error completing mock exam:', error);
    throw error;
  }
};

export const getMockExam = async (uid: string, examId: string): Promise<MockExam | null> => {
  try {
    const examRef = doc(db, 'users', uid, 'exams', examId);
    const docSnap = await getDoc(examRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        startedAt: data.startedAt?.toDate().toISOString(),
        completedAt: data.completedAt?.toDate().toISOString()
      } as MockExam;
    }
    return null;
  } catch (error) {
    console.error('Error getting mock exam:', error);
    throw error;
  }
};

export const getExamResults = async (uid: string): Promise<MockExam[]> => {
  try {
    const examsRef = collection(db, 'users', uid, 'exams');
    const querySnapshot = await getDocs(examsRef);
    
    const exams: MockExam[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      exams.push({
        ...data,
        id: doc.id,
        userId: uid,
        startedAt: data.startedAt?.toDate().toISOString(),
        completedAt: data.completedAt?.toDate().toISOString()
      } as MockExam);
    });
    
    return exams;
  } catch (error) {
    console.error('Error getting exam results:', error);
    throw error;
  }
};
