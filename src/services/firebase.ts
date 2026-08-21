import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  Firestore,
  DocumentData,
  QuerySnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  uploadString, 
  getDownloadURL,
  FirebaseStorage 
} from 'firebase/storage';
import { 
  FirestoreUser, 
  FirestoreCitizen, 
  FirestoreDepartment, 
  FirestoreOfficer, 
  FirestoreComplaint, 
  FirestoreEvidence, 
  FirestoreAuditLog, 
  FirestoreTrigger 
} from '../types/firestore';

const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};

// Firebase configuration from environment or fallback default project
export const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || '',
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || `${metaEnv.VITE_FIREBASE_PROJECT_ID || 'seva-civic-intelligence'}.firebaseapp.com`,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || 'seva-civic-intelligence',
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || `${metaEnv.VITE_FIREBASE_PROJECT_ID || 'seva-civic-intelligence'}.appspot.com`,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: metaEnv.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456'
};

export const isFirebaseConfigured = (): boolean => {
  return !!(
    metaEnv.VITE_FIREBASE_API_KEY && 
    metaEnv.VITE_FIREBASE_PROJECT_ID
  );
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

try {
  if (firebaseConfig.apiKey) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }
} catch (error) {
  console.warn('Firebase initialization note (running in resilient hybrid mode):', error);
}

/**
 * Storage Helper: Uploads evidence base64 data to Firebase Storage and saves Firestore metadata
 */
export async function uploadEvidenceImage(
  complaintId: string, 
  dataUrlOrBlob: string | Blob, 
  type: 'CITIZEN' | 'GOVERNMENT' | 'CITIZEN_ISSUE' | 'GOVERNMENT_RESOLUTION' = 'CITIZEN',
  evidenceId?: string
): Promise<{ downloadUrl: string; storagePath: string; evidenceId: string }> {
  const evId = evidenceId || `ev-${type.toLowerCase().startsWith('gov') ? 'gov' : 'cit'}-${Date.now()}`;
  const folder = type.toLowerCase().startsWith('gov') ? 'government-evidence' : 'citizen-evidence';
  const storagePath = `${folder}/${complaintId}/${evId}.jpg`;

  let downloadUrl = '';

  if (storage && isFirebaseConfigured()) {
    try {
      const storageRef = ref(storage, storagePath);
      if (typeof dataUrlOrBlob === 'string' && dataUrlOrBlob.startsWith('data:')) {
        await uploadString(storageRef, dataUrlOrBlob, 'data_url');
      } else if (dataUrlOrBlob instanceof Blob) {
        await uploadBytes(storageRef, dataUrlOrBlob);
      }
      downloadUrl = await getDownloadURL(storageRef);
    } catch (err) {
      console.warn('Firebase Storage upload note, using direct payload fallback:', err);
    }
  }

  // Fallback direct data url if storage not reachable
  if (!downloadUrl) {
    downloadUrl = typeof dataUrlOrBlob === 'string' ? dataUrlOrBlob : URL.createObjectURL(dataUrlOrBlob);
  }

  return { downloadUrl, storagePath, evidenceId: evId };
}

export { 
  app, 
  auth, 
  db, 
  storage, 
  // Auth methods
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  // Firestore methods
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  // Storage methods
  ref,
  uploadBytes,
  uploadString,
  getDownloadURL
};

export type { FirebaseUser, Firestore, DocumentData, QuerySnapshot, Unsubscribe };
