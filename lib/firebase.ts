import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getStorage, type FirebaseStorage } from "firebase/storage"
import { getAnalytics, type Analytics } from "firebase/analytics"

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBE6zHl0Gq0neyzy3fYLYvuc_JuJSGL_0c",
  authDomain: "diamond-zminter.firebaseapp.com",
  databaseURL: "https://diamond-zminter-default-rtdb.firebaseio.com",
  projectId: "diamond-zminter",
  storageBucket: "diamond-zminter.firebasestorage.app",
  messagingSenderId: "645985546491",
  appId: "1:645985546491:web:f17b7c96929114d63f405e",
  measurementId: "G-R34WPFKLDK",
}

// Initialize Firebase client
let app: FirebaseApp
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}

// Client-side services
export const auth: Auth = getAuth(app)
export const db: Firestore = getFirestore(app)
export const storage: FirebaseStorage = getStorage(app)

// Analytics (only on client-side)
let analytics: Analytics | null = null
if (typeof window !== "undefined") {
  analytics = getAnalytics(app)
}
export { analytics }

// Firebase Admin SDK for server-side operations
import { initializeApp as initializeAdminApp, getApps as getAdminApps, cert, type App } from "firebase-admin/app"
import { getAuth as getAdminAuth, type Auth as AdminAuth } from "firebase-admin/auth"
import { getFirestore as getAdminFirestore, type Firestore as AdminFirestore } from "firebase-admin/firestore"
import { getStorage as getAdminStorage, type Storage as AdminStorage } from "firebase-admin/storage"

// Server-side Firebase Admin configuration
let adminApp: App | null = null
let adminAuth: AdminAuth | null = null
let adminDb: AdminFirestore | null = null
let adminStorage: AdminStorage | null = null

// Initialize Firebase Admin only on server-side
if (typeof window === "undefined") {
  try {
    // Use the same project ID from your config
    const projectId = "diamond-zminter"
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY

    if (clientEmail && privateKey) {
      if (getAdminApps().length === 0) {
        adminApp = initializeAdminApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, "\n"),
          }),
          storageBucket: "diamond-zminter.firebasestorage.app",
          databaseURL: "https://diamond-zminter-default-rtdb.firebaseio.com",
        })
      } else {
        adminApp = getAdminApps()[0]
      }

      // Initialize admin services
      adminAuth = getAdminAuth(adminApp)
      adminDb = getAdminFirestore(adminApp)
      adminStorage = getAdminStorage(adminApp)
    } else {
      console.warn("Firebase Admin credentials not found. Some server-side features may not work.")
    }
  } catch (error) {
    console.error("Firebase Admin initialization error:", error)
  }
}

// Export admin services
export { adminAuth, adminDb, adminStorage }

// Firebase operations for application logic
export const firebaseOperations = {
  // Token operations
  async createToken(tokenId: string, tokenData: any) {
    if (!adminDb) {
      console.warn("Admin DB not available, using mock data")
      return { id: tokenId, ...tokenData }
    }

    try {
      const tokenRef = adminDb.collection("tokens").doc(tokenId)
      await tokenRef.set({
        ...tokenData,
        id: tokenId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      return { id: tokenId, ...tokenData }
    } catch (error) {
      console.error("Error creating token:", error)
      throw error
    }
  },

  async getToken(tokenId: string) {
    if (!adminDb) {
      console.warn("Admin DB not available, returning null")
      return null
    }

    try {
      const tokenDoc = await adminDb.collection("tokens").doc(tokenId).get()
      return tokenDoc.exists ? { id: tokenDoc.id, ...tokenDoc.data() } : null
    } catch (error) {
      console.error("Error getting token:", error)
      return null
    }
  },

  async getTokenByContractAddress(contractAddress: string) {
    if (!adminDb) {
      console.warn("Admin DB not available, returning null")
      return null
    }

    try {
      const tokensSnapshot = await adminDb
        .collection("tokens")
        .where("contractAddress", "==", contractAddress.toLowerCase())
        .limit(1)
        .get()

      if (tokensSnapshot.empty) {
        return null
      }

      const doc = tokensSnapshot.docs[0]
      return { id: doc.id, ...doc.data() }
    } catch (error) {
      console.error("Error getting token by contract address:", error)
      return null
    }
  },

  async getTokenBySymbol(symbol: string) {
    if (!adminDb) {
      console.warn("Admin DB not available, returning null")
      return null
    }

    try {
      const tokensSnapshot = await adminDb
        .collection("tokens")
        .where("symbol", "==", symbol.toUpperCase())
        .limit(1)
        .get()

      if (tokensSnapshot.empty) {
        return null
      }

      const doc = tokensSnapshot.docs[0]
      return { id: doc.id, ...doc.data() }
    } catch (error) {
      console.error("Error getting token by symbol:", error)
      return null
    }
  },

  async getTokens(limit = 100, startAfter?: any) {
    if (!adminDb) {
      console.warn("Admin DB not available, returning mock tokens")
      return [
        {
          id: "xmenity_social_token",
          name: "XMenity Social Token",
          symbol: "XMEN",
          contractAddress: "0x1234567890123456789012345678901234567890",
          totalSupply: "1000000",
          currentPrice: "0.05",
          creatorWallet: "0x1111111111111111111111111111111111111111",
          verified: true,
          description: "The official XMenity platform token for social creators",
          metrics: {
            followers: 15420,
            engagement: 8.7,
            influence: 92,
            posts: 342,
          },
          milestones: [
            { target: 10000, current: 15420, label: "Followers", completed: true },
            { target: 100, current: 92, label: "Influence Score", completed: false },
            { target: 500, current: 342, label: "Posts", completed: false },
          ],
          createdAt: new Date("2024-01-15"),
        },
        {
          id: "creator_coin_alpha",
          name: "Creator Coin Alpha",
          symbol: "CCA",
          contractAddress: "0x2345678901234567890123456789012345678901",
          totalSupply: "500000",
          currentPrice: "0.12",
          creatorWallet: "0x2222222222222222222222222222222222222222",
          verified: false,
          description: "Alpha creator's personal token for exclusive content access",
          metrics: {
            followers: 8930,
            engagement: 6.4,
            influence: 78,
            posts: 156,
          },
          milestones: [
            { target: 10000, current: 8930, label: "Followers", completed: false },
            { target: 80, current: 78, label: "Influence Score", completed: false },
            { target: 200, current: 156, label: "Posts", completed: false },
          ],
          createdAt: new Date("2024-02-01"),
        },
        {
          id: "diamond_creator_token",
          name: "Diamond Creator Token",
          symbol: "DCT",
          contractAddress: "0x3456789012345678901234567890123456789012",
          totalSupply: "2000000",
          currentPrice: "0.03",
          creatorWallet: "0x3333333333333333333333333333333333333333",
          verified: true,
          description: "Premium creator token with exclusive perks and rewards",
          metrics: {
            followers: 25680,
            engagement: 9.2,
            influence: 95,
            posts: 578,
          },
          milestones: [
            { target: 25000, current: 25680, label: "Followers", completed: true },
            { target: 90, current: 95, label: "Influence Score", completed: true },
            { target: 500, current: 578, label: "Posts", completed: true },
          ],
          createdAt: new Date("2024-01-20"),
        },
        {
          id: "social_influencer_coin",
          name: "Social Influencer Coin",
          symbol: "SIC",
          contractAddress: "0x4567890123456789012345678901234567890123",
          totalSupply: "750000",
          currentPrice: "0.08",
          creatorWallet: "0x4444444444444444444444444444444444444444",
          verified: true,
          description: "Token for top-tier social media influencer with global reach",
          metrics: {
            followers: 45230,
            engagement: 7.8,
            influence: 88,
            posts: 892,
          },
          milestones: [
            { target: 40000, current: 45230, label: "Followers", completed: true },
            { target: 85, current: 88, label: "Influence Score", completed: true },
            { target: 1000, current: 892, label: "Posts", completed: false },
          ],
          createdAt: new Date("2024-01-10"),
        },
        {
          id: "content_creator_beta",
          name: "Content Creator Beta",
          symbol: "CCB",
          contractAddress: "0x5678901234567890123456789012345678901234",
          totalSupply: "300000",
          currentPrice: "0.15",
          creatorWallet: "0x5555555555555555555555555555555555555555",
          verified: false,
          description: "Beta token for emerging content creator in gaming niche",
          metrics: {
            followers: 3420,
            engagement: 5.2,
            influence: 45,
            posts: 89,
          },
          milestones: [
            { target: 5000, current: 3420, label: "Followers", completed: false },
            { target: 50, current: 45, label: "Influence Score", completed: false },
            { target: 100, current: 89, label: "Posts", completed: false },
          ],
          createdAt: new Date("2024-02-10"),
        },
        {
          id: "viral_creator_token",
          name: "Viral Creator Token",
          symbol: "VCT",
          contractAddress: "0x6789012345678901234567890123456789012345",
          totalSupply: "1500000",
          currentPrice: "0.07",
          creatorWallet: "0x6666666666666666666666666666666666666666",
          verified: true,
          description: "Token from viral content creator known for trending videos",
          metrics: {
            followers: 67890,
            engagement: 12.4,
            influence: 97,
            posts: 234,
          },
          milestones: [
            { target: 50000, current: 67890, label: "Followers", completed: true },
            { target: 95, current: 97, label: "Influence Score", completed: true },
            { target: 300, current: 234, label: "Posts", completed: false },
          ],
          createdAt: new Date("2024-01-05"),
        },
      ]
    }

    try {
      let query = adminDb.collection("tokens").orderBy("createdAt", "desc")

      if (startAfter) {
        query = query.startAfter(startAfter)
      }

      query = query.limit(limit)

      const snapshot = await query.get()
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error("Error getting tokens:", error)
      return []
    }
  },

  async updateToken(tokenId: string, updates: any) {
    if (!adminDb) {
      console.warn("Admin DB not available, skipping update")
      return null
    }

    try {
      const tokenRef = adminDb.collection("tokens").doc(tokenId)
      await tokenRef.update({
        ...updates,
        updatedAt: new Date(),
      })
      return tokenRef
    } catch (error) {
      console.error("Error updating token:", error)
      throw error
    }
  },

  // User operations
  async createUserProfile(walletAddress: string, userData: any) {
    if (!adminDb) {
      console.warn("Admin DB not available, skipping user profile creation")
      return null
    }

    try {
      const userRef = adminDb.collection("users").doc(walletAddress.toLowerCase())
      await userRef.set({
        ...userData,
        walletAddress: walletAddress.toLowerCase(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      return userRef
    } catch (error) {
      console.error("Error creating user profile:", error)
      throw error
    }
  },

  async getUserProfile(walletAddress: string) {
    if (!adminDb) {
      console.warn("Admin DB not available, returning null")
      return null
    }

    try {
      const userDoc = await adminDb.collection("users").doc(walletAddress.toLowerCase()).get()
      return userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null
    } catch (error) {
      console.error("Error getting user profile:", error)
      return null
    }
  },

  async updateUserProfile(walletAddress: string, updates: any) {
    if (!adminDb) {
      console.warn("Admin DB not available, skipping update")
      return null
    }

    try {
      const userRef = adminDb.collection("users").doc(walletAddress.toLowerCase())
      await userRef.update({
        ...updates,
        updatedAt: new Date(),
      })
      return userRef
    } catch (error) {
      console.error("Error updating user profile:", error)
      throw error
    }
  },

  // Analytics operations
  async getTokenAnalytics(tokenId: string, period = "30d") {
    if (!adminDb) {
      console.warn("Admin DB not available, returning empty analytics")
      return []
    }

    try {
      const analyticsSnapshot = await adminDb
        .collection("analytics")
        .where("tokenId", "==", tokenId)
        .where("period", "==", period)
        .orderBy("timestamp", "desc")
        .limit(100)
        .get()

      return analyticsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error("Error getting token analytics:", error)
      return []
    }
  },

  async saveAnalyticsData(analyticsData: any) {
    if (!adminDb) {
      console.warn("Admin DB not available, skipping analytics save")
      return null
    }

    try {
      const analyticsRef = adminDb.collection("analytics").doc()
      await analyticsRef.set({
        ...analyticsData,
        timestamp: new Date(),
      })
      return analyticsRef
    } catch (error) {
      console.error("Error saving analytics data:", error)
      throw error
    }
  },

  // File upload operations
  async uploadFile(file: File, path: string): Promise<string> {
    if (!adminStorage) {
      console.warn("Admin Storage not available, returning placeholder URL")
      return `https://placeholder.com/${path}`
    }

    try {
      const bucket = adminStorage.bucket()
      const fileRef = bucket.file(path)

      // Convert File to Buffer for server-side upload
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
        },
      })

      await fileRef.makePublic()
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${path}`
      return publicUrl
    } catch (error) {
      console.error("Error uploading file:", error)
      throw error
    }
  },

  // Utility operations
  async trackEvent(eventType: string, eventData: any) {
    if (!adminDb) {
      console.warn("Admin DB not available, skipping event tracking")
      return null
    }

    try {
      const eventRef = adminDb.collection("events").doc()
      await eventRef.set({
        eventType,
        eventData,
        timestamp: new Date(),
      })
      return eventRef
    } catch (error) {
      console.error("Error tracking event:", error)
      throw error
    }
  },
}

// Export default
export default firebaseOperations
