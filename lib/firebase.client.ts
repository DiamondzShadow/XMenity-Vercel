import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getDatabase, Database } from 'firebase/database';

// Firebase configuration for client-side usage
const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'diamond-zminter',
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Initialize Firebase for client-side
let app: FirebaseApp;
if (typeof window !== 'undefined' && getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else if (typeof window !== 'undefined') {
  app = getApps()[0];
}

// Initialize Firebase services for client-side
export const auth: Auth | null = typeof window !== 'undefined' ? getAuth(app) : null;
export const db: Firestore | null = typeof window !== 'undefined' ? getFirestore(app) : null;
export const storage: FirebaseStorage | null = typeof window !== 'undefined' ? getStorage(app) : null;
export const rtdb: Database | null = typeof window !== 'undefined' ? getDatabase(app) : null;

// Client-side Firebase hooks
export const useFirebaseAuth = () => {
  if (typeof window === 'undefined') return null;
  return auth;
};

export const useFirebaseDb = () => {
  if (typeof window === 'undefined') return null;
  return db;
};

export const useFirebaseStorage = () => {
  if (typeof window === 'undefined') return null;
  return storage;
};

export const useFirebaseRtdb = () => {
  if (typeof window === 'undefined') return null;
  return rtdb;
};

// Client-side utility functions
export const FirebaseClientUtils = {
  // Add client-side specific utilities here
  async uploadFileFromBrowser(file: File, path: string): Promise<string> {
    if (!storage) throw new Error('Firebase storage not initialized');
    
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  async trackClientEvent(eventType: string, eventData: any) {
    if (!db) throw new Error('Firebase Firestore not initialized');
    
    const { collection, addDoc } = await import('firebase/firestore');
    
    try {
      const eventsRef = collection(db, 'client_events');
      await addDoc(eventsRef, {
        eventType,
        eventData,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Error tracking client event:', error);
      throw error;
    }
  },
};