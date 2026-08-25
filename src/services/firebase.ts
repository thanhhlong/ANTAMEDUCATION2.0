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

// Initialize Firebase with fallback
let app: any = null;
let db: any = null;

try {
  app = initializeApp(firebaseConfig);
  const databaseId = (firebaseConfig as any).firestoreDatabaseId;
  db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);

  // Enable Offline Persistence for offline-first capabilities
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firebase Offline Persistence: Multiple tabs open.');
    } else if (err.code === 'unimplemented') {
      console.warn('Firebase Offline Persistence: Browser does not support persistence.');
    }
  });
} catch (e) {
  console.warn('Firebase initialization notice:', e);
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
 * Bulk save documents in a collection (e.g., seeding database or manual save)
 */
export async function bulkSaveDocuments(collectionName: string, items: any[]): Promise<void> {
  if (!items || items.length === 0) return;
  try {
    const segmentSize = 400;
    for (let i = 0; i < items.length; i += segmentSize) {
      const batch = writeBatch(db);
      const segment = items.slice(i, i + segmentSize);
      segment.forEach((item) => {
        if (!item || !item.id) return;
        const docRef = doc(db, collectionName, item.id);
        const sanitized = JSON.parse(JSON.stringify(item, (key, value) => value === undefined ? null : value));
        batch.set(docRef, sanitized, { merge: true });
      });
      await batch.commit();
    }
  } catch (error) {
    console.error(`Error batch saving ${collectionName}:`, error);
    throw error;
  }
}

export interface AllDatabaseCollections {
  users?: any[];
  students?: any[];
  subjects?: any[];
  tuitionPlans?: any[];
  invoices?: any[];
  expenses?: any[];
  leads?: any[];
  tutors?: any[];
  classes?: any[];
  scheduleSessions?: any[];
  attendance?: any[];
  lessons?: any[];
  assignments?: any[];
  submissions?: any[];
}

/**
 * Persists all collections data to Firestore
 */
export async function saveAllCollectionsToFirestore(data: AllDatabaseCollections): Promise<{
  totalSaved: number;
  collectionsSaved: number;
  timestamp: string;
}> {
  let totalCount = 0;
  let colCount = 0;

  const entries = Object.entries(data) as [string, any[]][];
  for (const [colName, items] of entries) {
    if (Array.isArray(items) && items.length > 0) {
      await bulkSaveDocuments(colName, items);
      totalCount += items.length;
      colCount++;
    }
  }

  // Update a metadata document with last sync timestamp
  try {
    const metaRef = doc(db, '_system_meta', 'sync_status');
    await setDoc(metaRef, {
      lastSavedAt: new Date().toISOString(),
      totalRecords: totalCount,
      collectionsCount: colCount,
      environment: 'production'
    }, { merge: true });
  } catch (metaErr) {
    console.warn('Could not write sync_status metadata:', metaErr);
  }

  return {
    totalSaved: totalCount,
    collectionsSaved: colCount,
    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };
}

/**
 * Seeds Firestore with default initial data if Firestore is currently empty
 */
export async function seedIfEmpty(collectionName: string, initialData: any[]): Promise<any[]> {
  try {
    const existing = await fetchCollection(collectionName);
    if (existing.length === 0 && initialData.length > 0) {
      console.log(`Seeding Firestore collection ${collectionName} with ${initialData.length} items.`);
      await bulkSaveDocuments(collectionName, initialData);
      return initialData;
    }
    return existing.length > 0 ? existing : initialData;
  } catch (error) {
    console.warn(`Could not fetch/seed ${collectionName}, falling back to initial local data.`, error);
    return initialData;
  }
}

export { db, app };
