import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { MunicipalityData } from '../types/finance';

// Initialize Firebase App and Services
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore with custom databaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const FIRESTORE_COLLECTION = 'municipality_finance';
export const FIRESTORE_DOC_ID = 'current';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return false;
    }
    return true;
  }
}

// Fetch current data for all menus from Firestore
export async function fetchMunicipalityDataFromFirestore(): Promise<MunicipalityData | null> {
  const docPath = `${FIRESTORE_COLLECTION}/${FIRESTORE_DOC_ID}`;
  try {
    const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as MunicipalityData;
    }
    return null;
  } catch (error) {
    console.warn('Error fetching from Firestore, will fallback to local/server:', error);
    try {
      handleFirestoreError(error, OperationType.GET, docPath);
    } catch {
      // Continue gracefully so app can use cached or local server data if network error
    }
    return null;
  }
}

// Save current data for all menus to Firestore
export async function saveMunicipalityDataToFirestore(data: MunicipalityData): Promise<boolean> {
  const docPath = `${FIRESTORE_COLLECTION}/${FIRESTORE_DOC_ID}`;
  try {
    const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
    await setDoc(docRef, data, { merge: true });
    return true;
  } catch (error) {
    console.warn('Error saving to Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    } catch {
      // Graceful error handling
    }
    return false;
  }
}

// Real-time synchronization subscription for all menus
export function subscribeToMunicipalityData(
  onData: (data: MunicipalityData) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const docPath = `${FIRESTORE_COLLECTION}/${FIRESTORE_DOC_ID}`;
  const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const remoteData = snapshot.data() as MunicipalityData;
        onData(remoteData);
      }
    },
    (error) => {
      console.warn('Firestore snapshot error on', docPath, error);
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.GET, docPath);
      } catch {
        // Handled
      }
    }
  );
}
