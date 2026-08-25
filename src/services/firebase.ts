import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App & Firestore Database
let app: any = null;
let db: any = null;
let auth: any = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const databaseId = (firebaseConfig as any).firestoreDatabaseId;
  db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  auth = getAuth(app);
} catch (e) {
  console.warn('Firebase initialization notice:', e);
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Fetch all documents in a collection
 */
export async function fetchCollection<T>(collectionName: string): Promise<T[]> {
  if (!db) return [];
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const data: T[] = [];
    snapshot.forEach((docSnap) => {
      data.push({ id: docSnap.id, ...docSnap.data() } as T);
    });
    return data;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionName);
    return [];
  }
}

/**
 * Save/Update a single document in a collection
 */
export async function saveDocument(collectionName: string, id: string, data: any): Promise<void> {
  if (!db || !id) return;
  try {
    const docRef = doc(db, collectionName, id);
    const sanitizedData = JSON.parse(JSON.stringify(data, (_, value) => value === undefined ? null : value));
    await setDoc(docRef, sanitizedData, { merge: true });
  } catch (error) {
    console.error(`Error saving document in ${collectionName}/${id}:`, error);
  }
}

/**
 * Delete a document from a collection
 */
export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  if (!db || !id) return;
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document ${collectionName}/${id}:`, error);
  }
}

/**
 * Bulk save documents in a collection with full sync (Upsert current + prune deleted IDs)
 */
export async function syncCollectionToFirestore(collectionName: string, currentItems: any[]): Promise<number> {
  if (!db) return 0;
  try {
    // 1. Fetch current document IDs from Firestore to identify deletions
    const existingSnap = await getDocs(collection(db, collectionName));
    const currentIdSet = new Set(currentItems.map((item) => item.id).filter(Boolean));
    const toDeleteIds: string[] = [];

    existingSnap.forEach((docSnap) => {
      if (!currentIdSet.has(docSnap.id)) {
        toDeleteIds.push(docSnap.id);
      }
    });

    // 2. Perform write batches for upserting current items
    const segmentSize = 400;
    for (let i = 0; i < currentItems.length; i += segmentSize) {
      const batch = writeBatch(db);
      const segment = currentItems.slice(i, i + segmentSize);
      segment.forEach((item) => {
        if (!item || !item.id) return;
        const docRef = doc(db, collectionName, item.id);
        const sanitized = JSON.parse(JSON.stringify(item, (_, value) => value === undefined ? null : value));
        batch.set(docRef, sanitized, { merge: true });
      });
      await batch.commit();
    }

    // 3. Delete obsolete items in batches
    for (let i = 0; i < toDeleteIds.length; i += segmentSize) {
      const batch = writeBatch(db);
      const segment = toDeleteIds.slice(i, i + segmentSize);
      segment.forEach((delId) => {
        const docRef = doc(db, collectionName, delId);
        batch.delete(docRef);
      });
      await batch.commit();
    }

    return currentItems.length;
  } catch (error) {
    console.error(`Error syncing collection ${collectionName} to Firestore:`, error);
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
 * Persists all collections data cleanly to Firestore
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
    if (Array.isArray(items)) {
      await syncCollectionToFirestore(colName, items);
      totalCount += items.length;
      colCount++;
    }
  }

  // Update root metadata document with latest synchronization info
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
 * Fetch all collections from Firestore
 */
export async function fetchAllCollectionsFromFirestore(): Promise<AllDatabaseCollections | null> {
  if (!db) return null;
  try {
    const [
      users,
      students,
      subjects,
      tuitionPlans,
      invoices,
      expenses,
      leads,
      tutors,
      classes,
      scheduleSessions,
      attendance,
      lessons,
      assignments,
      submissions,
    ] = await Promise.all([
      fetchCollection<any>('users'),
      fetchCollection<any>('students'),
      fetchCollection<any>('subjects'),
      fetchCollection<any>('tuitionPlans'),
      fetchCollection<any>('invoices'),
      fetchCollection<any>('expenses'),
      fetchCollection<any>('leads'),
      fetchCollection<any>('tutors'),
      fetchCollection<any>('classes'),
      fetchCollection<any>('scheduleSessions'),
      fetchCollection<any>('attendance'),
      fetchCollection<any>('lessons'),
      fetchCollection<any>('assignments'),
      fetchCollection<any>('submissions'),
    ]);

    const totalFetched = (users?.length || 0) + (students?.length || 0) + (invoices?.length || 0);
    if (totalFetched === 0) return null;

    return {
      users,
      students,
      subjects,
      tuitionPlans,
      invoices,
      expenses,
      leads,
      tutors,
      classes,
      scheduleSessions,
      attendance,
      lessons,
      assignments,
      submissions,
    };
  } catch (error) {
    console.warn('Could not fetch all collections from Firestore:', error);
    return null;
  }
}

/**
 * Seeds Firestore with default initial data if Firestore is currently empty
 */
export async function seedIfEmpty(collectionName: string, initialData: any[]): Promise<any[]> {
  if (!db) return initialData;
  try {
    const existing = await fetchCollection(collectionName);
    if (existing.length === 0 && initialData.length > 0) {
      console.log(`Seeding Firestore collection ${collectionName} with ${initialData.length} items.`);
      await syncCollectionToFirestore(collectionName, initialData);
      return initialData;
    }
    return existing.length > 0 ? existing : initialData;
  } catch (error) {
    console.warn(`Could not fetch/seed ${collectionName}, falling back to initial local data.`, error);
    return initialData;
  }
}

export { db, app, auth };
