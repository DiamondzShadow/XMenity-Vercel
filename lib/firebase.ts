import { initializeApp, getApps } from "firebase/app"
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const storage = getStorage(app)
export const db = getFirestore(app)

// Storage functions
export async function uploadFile(file: File, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    return downloadURL
  } catch (error) {
    console.error("Error uploading file:", error)
    throw new Error("Failed to upload file")
  }
}

export async function deleteFile(path: string): Promise<void> {
  try {
    const storageRef = ref(storage, path)
    await deleteObject(storageRef)
  } catch (error) {
    console.error("Error deleting file:", error)
    throw new Error("Failed to delete file")
  }
}

// Firestore functions
export async function createDocument(collectionName: string, docId: string, data: any): Promise<void> {
  try {
    await setDoc(doc(db, collectionName, docId), {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error("Error creating document:", error)
    throw new Error("Failed to create document")
  }
}

export async function getDocument(collectionName: string, docId: string): Promise<any> {
  try {
    const docRef = doc(db, collectionName, docId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting document:", error)
    throw new Error("Failed to get document")
  }
}

export async function updateDocument(collectionName: string, docId: string, data: any): Promise<void> {
  try {
    await updateDoc(doc(db, collectionName, docId), {
      ...data,
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error("Error updating document:", error)
    throw new Error("Failed to update document")
  }
}

export async function deleteDocument(collectionName: string, docId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, collectionName, docId))
  } catch (error) {
    console.error("Error deleting document:", error)
    throw new Error("Failed to delete document")
  }
}

export async function getDocuments(collectionName: string, conditions?: any[]): Promise<any[]> {
  try {
    let q = collection(db, collectionName)

    if (conditions && conditions.length > 0) {
      q = query(q, ...conditions)
    }

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error("Error getting documents:", error)
    throw new Error("Failed to get documents")
  }
}

// Token-specific functions
export async function saveToken(tokenData: any): Promise<void> {
  const tokenId = `${tokenData.contractAddress}_${tokenData.chainId}`
  await createDocument("tokens", tokenId, tokenData)
}

export async function getToken(contractAddress: string, chainId: number): Promise<any> {
  const tokenId = `${contractAddress}_${chainId}`
  return await getDocument("tokens", tokenId)
}

export async function getTokens(filters?: any): Promise<any[]> {
  const conditions = []

  if (filters?.creator) {
    conditions.push(where("creator", "==", filters.creator))
  }

  if (filters?.verified !== undefined) {
    conditions.push(where("verified", "==", filters.verified))
  }

  conditions.push(orderBy("createdAt", "desc"))

  if (filters?.limit) {
    conditions.push(limit(filters.limit))
  }

  return await getDocuments("tokens", conditions)
}

export async function updateTokenMetrics(contractAddress: string, chainId: number, metrics: any): Promise<void> {
  const tokenId = `${contractAddress}_${chainId}`
  await updateDocument("tokens", tokenId, { metrics })
}
