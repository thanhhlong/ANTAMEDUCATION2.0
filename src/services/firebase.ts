import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  enableIndexedDbPersistence,
  getDoc
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enable Offline Persistence for offline-first capabilities
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firebase Offline Persistence: Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('Firebase Offline Persistence: The current browser does not support all of the features required to enable persistence.');
    }
  });
} catch (e) {
  console.error('Failed to enable Firestore persistence:', e);
}

/**
 * Fetch all documents in a collection
 */
export async function fetchCollection<T>(collectionName: string): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const data: T[] = [];
    snapshot.forEach((docSnap) => {
      data.push({ id: docSnap.id, ...docSnap.data() } as T);
    });
    return data;
  } catch (error) {
    console.error(`Error fetching collection ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Save/Update a single document in a collection
 */
export async function saveDocument(collectionName: string, id: string, data: any): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    // Remove any undefined fields to prevent Firestore serialization errors
    const sanitizedData = JSON.parse(JSON.stringify(data, (key, value) => value === undefined ? null : value));
    await setDoc(docRef, sanitizedData, { merge: true });
  } catch (error) {
    console.error(`Error saving document in ${collectionName}/${id}:`, error);
    throw error;
  }
}

/**
 * Delete a document from a collection
 */
export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document ${collectionName}/${id}:`, error);
    throw error;
  }
}

/**
 * Bulk save documents in a collection (e.g., seeding database)
 */
export async function bulkSaveDocuments(collectionName: string, items: any[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    items.forEach((item) => {
      const docRef = doc(db, collectionName, item.id);
      const sanitized = JSON.parse(JSON.stringify(item, (key, value) => value === undefined ? null : value));
      batch.set(docRef, sanitized, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    console.error(`Error batch saving ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Seeds Firestore with default initial data if Firestore is currently empty
 */
export async function seedIfEmpty(collectionName: string, initialData: any[]): Promise<any[]> {
  try {
    const existing = await fetchCollection(collectionName);
    if (existing.length === 0 && initialData.length > 0) {
      console.log(`Seeding Firestore collection ${collectionName} with ${initialData.length} items.`);
      // Run bulk save in segments to respect firestore batch limits (500 items max)
      const segments: any[][] = [];
      const segmentSize = 400;
      for (let i = 0; i < initialData.length; i += segmentSize) {
        segments.push(initialData.slice(i, i + segmentSize));
      }
      for (const segment of segments) {
        await bulkSaveDocuments(collectionName, segment);
      }
      return initialData;
    }
    return existing.length > 0 ? existing : initialData;
  } catch (error) {
    console.warn(`Could not fetch/seed ${collectionName}, falling back to initial local data.`, error);
    return initialData;
  }
}

export { db, app };
