import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SiteConfig, Enquiry } from '../types';

export enum OperationType {
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
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {}, // Simplified for now
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const CONFIG_PATH = 'config/site';

export const siteService = {
  async getConfig(): Promise<SiteConfig | null> {
    try {
      const docRef = doc(db, CONFIG_PATH);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as SiteConfig;
      }
      return null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, CONFIG_PATH);
      return null;
    }
  },

  async seedData(data: SiteConfig) {
    try {
      const docRef = doc(db, CONFIG_PATH);
      await setDoc(docRef, data);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, CONFIG_PATH);
    }
  },

  async submitEnquiry(enquiry: Omit<Enquiry, 'createdAt'>) {
    const path = 'enquiries';
    try {
      await addDoc(collection(db, path), {
        ...enquiry,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  },
  
  async getEnquiries(): Promise<Enquiry[]> {
    const path = 'enquiries';
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ ...doc.data() } as Enquiry));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
      return [];
    }
  }
};
