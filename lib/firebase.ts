import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getDatabase, Database } from 'firebase/database';

// Firebase configuration for diamond-zminter project
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'diamond-zminter',
  databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://diamond-zminter-default-rtdb.firebaseio.com',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'diamond-zminter.firebasestorage.app',
  // Add other config values as needed
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const rtdb: Database = getDatabase(app);

// Firebase Admin SDK for server-side operations
import { initializeApp as initializeAdminApp, getApps as getAdminApps, cert } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';
import { getDatabase as getAdminDatabase } from 'firebase-admin/database';

// Server-side Firebase Admin configuration
let adminApp: any;
if (typeof window === 'undefined') {
  try {
    if (getAdminApps().length === 0) {
      adminApp = initializeAdminApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    } else {
      adminApp = getAdminApps()[0];
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

// Export admin services
export const adminAuth = typeof window === 'undefined' && adminApp ? getAdminAuth(adminApp) : null;
export const adminDb = typeof window === 'undefined' && adminApp ? getAdminFirestore(adminApp) : null;
export const adminStorage = typeof window === 'undefined' && adminApp ? getAdminStorage(adminApp) : null;
export const adminRtdb = typeof window === 'undefined' && adminApp ? getAdminDatabase(adminApp) : null;

// Firebase utility functions
export const FirebaseUtils = {
  // User management utilities
  async createUserProfile(userId: string, userData: any) {
    if (!adminDb) throw new Error('Admin DB not initialized');
    
    try {
      const userRef = adminDb.collection('users').doc(userId);
      await userRef.set({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return userRef;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  },

  async getUserProfile(userId: string) {
    if (!adminDb) throw new Error('Admin DB not initialized');
    
    try {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      return userDoc.exists ? userDoc.data() : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  },

  async updateUserProfile(userId: string, updates: any) {
    if (!adminDb) throw new Error('Admin DB not initialized');
    
    try {
      const userRef = adminDb.collection('users').doc(userId);
      await userRef.update({
        ...updates,
        updatedAt: new Date(),
      });
      return userRef;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Token tracking utilities
  async trackTokenCreation(tokenData: any) {
    if (!adminDb) throw new Error('Admin DB not initialized');
    
    try {
      const tokenRef = adminDb.collection('tokens').doc(tokenData.contractAddress);
      await tokenRef.set({
        ...tokenData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return tokenRef;
    } catch (error) {
      console.error('Error tracking token creation:', error);
      throw error;
    }
  },

  async getTokenInfo(contractAddress: string) {
    if (!adminDb) throw new Error('Admin DB not initialized');
    
    try {
      const tokenDoc = await adminDb.collection('tokens').doc(contractAddress).get();
      return tokenDoc.exists ? tokenDoc.data() : null;
    } catch (error) {
      console.error('Error getting token info:', error);
      throw error;
    }
  },

  // Transaction logging
  async logTransaction(transactionData: any) {
    if (!adminDb) throw new Error('Admin DB not initialized');
    
    try {
      const transactionRef = adminDb.collection('transactions').doc(transactionData.txHash);
      await transactionRef.set({
        ...transactionData,
        timestamp: new Date(),
      });
      return transactionRef;
    } catch (error) {
      console.error('Error logging transaction:', error);
      throw error;
    }
  },

  // Real-time updates using Realtime Database
  async sendRealtimeUpdate(path: string, data: any) {
    if (!adminRtdb) throw new Error('Admin RTDB not initialized');
    
    try {
      const ref = adminRtdb.ref(path);
      await ref.set({
        ...data,
        timestamp: Date.now(),
      });
      return ref;
    } catch (error) {
      console.error('Error sending realtime update:', error);
      throw error;
    }
  },

  // Analytics tracking
  async trackEvent(eventType: string, eventData: any) {
    if (!adminDb) throw new Error('Admin DB not initialized');
    
    try {
      const eventRef = adminDb.collection('analytics').doc();
      await eventRef.set({
        eventType,
        eventData,
        timestamp: new Date(),
      });
      return eventRef;
    } catch (error) {
      console.error('Error tracking event:', error);
      throw error;
    }
  },

  // File upload utilities
  async uploadFile(file: File, path: string): Promise<string> {
    if (!adminStorage) throw new Error('Admin Storage not initialized');
    
    try {
      const bucket = adminStorage.bucket();
      const fileRef = bucket.file(path);
      
      const stream = fileRef.createWriteStream({
        metadata: {
          contentType: file.type,
        },
      });

      return new Promise((resolve, reject) => {
        stream.on('error', reject);
        stream.on('finish', async () => {
          try {
            await fileRef.makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${path}`;
            resolve(publicUrl);
          } catch (error) {
            reject(error);
          }
        });
        
        const reader = file.stream().getReader();
        const pump = async () => {
          const { done, value } = await reader.read();
          if (done) {
            stream.end();
          } else {
            stream.write(value);
            pump();
          }
        };
        pump();
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Backup utilities
  async backupUserData(userId: string) {
    if (!adminDb) throw new Error('Admin DB not initialized');
    
    try {
      const userProfile = await this.getUserProfile(userId);
      const backupRef = adminDb.collection('backups').doc(`${userId}_${Date.now()}`);
      await backupRef.set({
        userId,
        userProfile,
        timestamp: new Date(),
      });
      return backupRef;
    } catch (error) {
      console.error('Error backing up user data:', error);
      throw error;
    }
  },
};

// Firebase hooks for React components
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

// Firebase operations for application logic
export const firebaseOperations = {
  // Token operations
  async createToken(tokenId: string, tokenData: any) {
    if (!adminDb) throw new Error('Admin DB not initialized');
    
    try {
      const tokenRef = adminDb.collection('tokens').doc(tokenId);
      await tokenRef.set({
        ...tokenData,
        id: tokenId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return tokenRef;
    } catch (error) {
      console.error('Error creating token:', error);
      throw error;
    }
  },

  async getToken(tokenId: string) {
    if (!adminDb) throw new Error('Admin DB not initialized');
    
    try {
      const tokenDoc = await adminDb.collection('tokens').doc(tokenId).get();
      return tokenDoc.exists ? { id: tokenDoc.id, ...tokenDoc.data() } : null;
    } catch (error) {
      console.error('Error getting token:', error);
      throw error;
    }
  },

  async getTokenByContractAddress(contractAddress: string) {
    if (!adminDb) throw new Error('Admin DB not initialized');
    
    try {
      const tokensSnapshot = await adminDb.collection('tokens')
        .where('contractAddress', '==', contractAddress.toLowerCase())
        .limit(1)
        .get();
      
      if (tokensSnapshot.empty) {
        return null;
      }
      
      const doc = tokensSnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error getting token by contract address:', error);
      throw error;
    }
  },

  async getTokenBySymbol(symbol: string) {
    if (!adminDb) throw new Error('Admin DB not initialized');
    
    try {
      const tokensSnapshot = await adminDb.collection('tokens')
        .where('symbol', '==', symbol.toUpperCase())
        .limit(1)
        .get();
      
      if (tokensSnapshot.empty) {
        return null;
      }
      
      const doc = tokensSnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error getting token by symbol:', error);
      throw error;
    }
  },

  async getTokens(limit: number = 100, startAfter?: any) {
    if (!adminDb) throw new Error('Admin DB not initialized');
    
    try {
      let query = adminDb.collection('tokens').orderBy('createdAt', 'desc');
      
      if (startAfter) {
        query = query.startAfter(startAfter);
      }
      
      query = query.limit(limit);
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw error;
    }
  },

  async updateToken(tokenId: string, updates: any) {
    if (!adminDb) throw new Error('Admin DB not initialized');
    
    try {
      const tokenRef = adminDb.collection('tokens').doc(tokenId);
      await tokenRef.update({
        ...updates,
        updatedAt: new Date(),
      });
      return tokenRef;
    } catch (error) {
      console.error('Error updating token:', error);
      throw error;
    }
  },

  // User operations
  async createUserProfile(walletAddress: string, userData: any) {
    if (!adminDb) throw new Error('Admin DB not initialized');
    
    try {
      const userRef = adminDb.collection('users').doc(walletAddress.toLowerCase());
      await userRef.set({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return userRef;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  },

  async getUserProfile(walletAddress: string) {
    if (!adminDb) throw new Error('Admin DB not initialized');
    
    try {
      const userDoc = await adminDb.collection('users').doc(walletAddress.toLowerCase()).get();
      return userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  },

  async updateUserProfile(walletAddress: string, updates: any) {
    if (!adminDb) throw new Error('Admin DB not initialized');
    
    try {
      const userRef = adminDb.collection('users').doc(walletAddress.toLowerCase());
      await userRef.update({
        ...updates,
        updatedAt: new Date(),
      });
      return userRef;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Analytics operations
  async getTokenAnalytics(tokenId: string, period: string = '30d') {
    if (!adminDb) throw new Error('Admin DB not initialized');
    
    try {
      const analyticsSnapshot = await adminDb.collection('analytics')
        .where('tokenId', '==', tokenId)
        .where('period', '==', period)
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();
      
      return analyticsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting token analytics:', error);
      throw error;
    }
  },

  async saveAnalyticsData(analyticsData: any) {
    if (!adminDb) throw new Error('Admin DB not initialized');
    
    try {
      const analyticsRef = adminDb.collection('analytics').doc();
      await analyticsRef.set({
        ...analyticsData,
        timestamp: new Date(),
      });
      return analyticsRef;
    } catch (error) {
      console.error('Error saving analytics data:', error);
      throw error;
    }
  },
};
