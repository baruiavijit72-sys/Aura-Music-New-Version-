import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User 
} from 'firebase/auth';
import { 
  initializeFirestore,
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile } from '../types';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with robust networking and fallback
export const db = (() => {
  try {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
      experimentalAutoDetectLongPolling: true,
    }, firebaseConfig.firestoreDatabaseId || '(default)');
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
  }
})();

// Auth instance
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
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

// Connection test helper
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client is in offline mode.");
    }
    return false;
  }
}

// OAuth Providers Setup
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
googleProvider.addScope('email');
googleProvider.addScope('profile');

export const facebookProvider = new FacebookAuthProvider();
facebookProvider.setCustomParameters({ display: 'popup' });
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  
  // Persist user record in Firestore
  await syncUserProfileToFirestore(user.uid, {
    name: user.displayName || 'Google User',
    email: user.email || '',
    photoURL: user.photoURL || '',
    authProvider: 'GOOGLE',
    lastLoginAt: Date.now()
  });

  return user;
}

/**
 * Sign in with Facebook Popup
 */
export async function signInWithFacebook(): Promise<User> {
  const result = await signInWithPopup(auth, facebookProvider);
  const user = result.user;

  // Persist user record in Firestore
  await syncUserProfileToFirestore(user.uid, {
    name: user.displayName || 'Facebook User',
    email: user.email || '',
    photoURL: user.photoURL || '',
    authProvider: 'FACEBOOK',
    lastLoginAt: Date.now()
  });

  return user;
}

/**
 * Sign in with Email and Password
 */
export async function signInWithEmail(email: string, pass: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  const user = result.user;
  
  await syncUserProfileToFirestore(user.uid, {
    name: user.displayName || user.email?.split('@')[0] || 'Aura Member',
    email: user.email || '',
    photoURL: user.photoURL || '',
    authProvider: 'EMAIL',
    lastLoginAt: Date.now()
  });

  return user;
}

/**
 * Create Account with Email and Password
 */
export async function signUpWithEmail(email: string, pass: string, displayName?: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  const user = result.user;

  if (displayName) {
    await updateProfile(user, { displayName });
  }

  await syncUserProfileToFirestore(user.uid, {
    name: displayName || user.displayName || user.email?.split('@')[0] || 'Aura Member',
    email: user.email || '',
    photoURL: '',
    authProvider: 'EMAIL',
    lastLoginAt: Date.now()
  });

  return user;
}

/**
 * Sign Out
 */
export async function logOut(): Promise<void> {
  await signOut(auth);
}

/**
 * Save user profile to Firestore
 */
export async function syncUserProfileToFirestore(userId: string, data: Partial<{
  name: string;
  email: string;
  photoURL: string;
  authProvider: string;
  lastCloudBackup: number;
  totalListeningSeconds: number;
  lastLoginAt: number;
}>): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      userId,
      ...data,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to sync user profile to Firestore:', err);
  }
}

/**
 * Fetch user profile from Firestore
 */
export async function fetchUserProfileFromFirestore(userId: string): Promise<any | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error('Failed to fetch user profile from Firestore:', err);
    return null;
  }
}

/**
 * Save Full Cloud Backup to Firestore
 */
export async function saveCloudBackupToFirestore(userId: string, dataJson: string): Promise<number> {
  const now = Date.now();
  const backupRef = doc(db, 'users', userId, 'backups', 'latest');
  const userRef = doc(db, 'users', userId);

  await setDoc(backupRef, {
    userId,
    dataJson,
    updatedAt: now
  });

  await setDoc(userRef, {
    lastCloudBackup: now
  }, { merge: true });

  return now;
}

/**
 * Fetch Full Cloud Backup from Firestore
 */
export async function fetchCloudBackupFromFirestore(userId: string): Promise<string | null> {
  const backupRef = doc(db, 'users', userId, 'backups', 'latest');
  const snap = await getDoc(backupRef);
  if (snap.exists() && snap.data()?.dataJson) {
    return snap.data().dataJson;
  }
  return null;
}

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  doc,
  getDoc,
  setDoc,
  updateDoc
};

export type { User };
