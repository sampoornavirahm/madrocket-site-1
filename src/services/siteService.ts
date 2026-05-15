import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, orderBy, getDocs, updateDoc, where, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { SiteConfig, Enquiry, UserProfile, Lead, SystemLog } from '../types';

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
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
  
  async getEnquiries(planFilter?: string): Promise<Enquiry[]> {
    const path = 'enquiries';
    try {
      let q = query(collection(db, path), orderBy('createdAt', 'desc'));
      if (planFilter && planFilter !== 'All Plans') {
        q = query(collection(db, path), where('plan', '==', planFilter), orderBy('createdAt', 'desc'));
      }
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ ...doc.data() } as Enquiry));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
      return [];
    }
  },

  async updateClients(clients: string[]): Promise<void> {
    try {
      const docRef = doc(db, CONFIG_PATH);
      await updateDoc(docRef, { clients });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, CONFIG_PATH);
    }
  },

  async updateMarketing(marketing: SiteConfig['marketing']): Promise<void> {
    try {
      const docRef = doc(db, CONFIG_PATH);
      await updateDoc(docRef, { marketing });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, CONFIG_PATH);
    }
  },

  async updateConfig(updates: Partial<SiteConfig>): Promise<void> {
    try {
      const docRef = doc(db, CONFIG_PATH);
      await updateDoc(docRef, updates);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, CONFIG_PATH);
    }
  },

  async updateOrganization(data: { teams?: string[], batches?: string[] }): Promise<void> {
    try {
      const docRef = doc(db, CONFIG_PATH);
      await updateDoc(docRef, data);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, CONFIG_PATH);
    }
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
      return null;
    }
  },

  async createUserProfile(profile: UserProfile): Promise<void> {
    const path = `users/${profile.uid}`;
    try {
      await setDoc(doc(db, 'users', profile.uid), profile);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async getLeads(filters: { salesRepId?: string, team?: string, batch?: string }): Promise<Lead[]> {
    const path = 'leads';
    try {
      let q = query(collection(db, path), orderBy('createdAt', 'desc'));
      
      if (filters.salesRepId) {
        q = query(q, where('salesRepId', '==', filters.salesRepId));
      }
      
      // If team is null but provided, filter for null
      if (filters.team !== undefined) {
        if (filters.team === 'All Teams') {
           // Admin Case - broad query allowed by rules
        } else {
           q = query(q, where('team', '==', filters.team));
        }
      }
      
      if (filters.batch && filters.batch !== 'All Batches') {
        q = query(q, where('batch', '==', filters.batch));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Lead));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
      return [];
    }
  },

  async addLead(lead: Omit<Lead, 'createdAt' | 'updatedAt' | 'id'>): Promise<void> {
    const path = 'leads';
    try {
      await addDoc(collection(db, path), {
        ...lead,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  },

  async updateLead(leadId: string, updates: Partial<Lead>): Promise<void> {
    const path = `leads/${leadId}`;
    try {
      const docRef = doc(db, 'leads', leadId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async deleteLead(leadId: string): Promise<void> {
    const path = `leads/${leadId}`;
    try {
      const docRef = doc(db, 'leads', leadId);
      await updateDoc(docRef, { 
        status: 'Deleted',
        updatedAt: serverTimestamp() 
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async addLeadComment(leadId: string, comment: any): Promise<void> {
    const path = `leads/${leadId}`;
    try {
      const docRef = doc(db, 'leads', leadId);
      const leadSnap = await getDoc(docRef);
      if (leadSnap.exists()) {
        const currentComments = (leadSnap.data() as Lead).comments || [];
        await updateDoc(docRef, {
          comments: [...currentComments, { ...comment, id: Math.random().toString(36).substr(2, 9), createdAt: new Date() }],
          updatedAt: serverTimestamp()
        });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async getAllUsers(team?: string): Promise<UserProfile[]> {
    const path = 'users';
    try {
      let q = query(collection(db, path));
      if (team) {
        q = query(q, where('team', '==', team));
      }
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as UserProfile);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
      return [];
    }
  },

  subscribeAllUsers(callback: (users: UserProfile[]) => void, team?: string, onError?: (error: any) => void): () => void {
    const path = 'users';
    let q = query(collection(db, path));
    if (team) {
      q = query(q, where('team', '==', team));
    }
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data() as UserProfile);
      callback(users);
    }, (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  subscribeLeads(filters: { salesRepId?: string, team?: string, batch?: string }, callback: (leads: Lead[]) => void): () => void {
    const path = 'leads';
    let q = query(collection(db, path), orderBy('createdAt', 'desc'));
    
    if (filters.salesRepId) {
      q = query(q, where('salesRepId', '==', filters.salesRepId));
    }
    
    if (filters.team !== undefined) {
      if (filters.team === 'All Teams') {
        // Admin allowed
      } else {
        q = query(q, where('team', '==', filters.team));
      }
    }
    
    if (filters.batch && filters.batch !== 'All Batches') {
      q = query(q, where('batch', '==', filters.batch));
    }

    return onSnapshot(q, (snapshot) => {
      const leads = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Lead));
      callback(leads);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  },

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, updates);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async activateEnrollment(uid: string, comment: string): Promise<void> {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, {
        isEnrollmentActive: true,
        'enrollment.comment': comment,
        'enrollment.status': 'none'
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async submitEnrollment(uid: string, data: any): Promise<void> {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, {
        'enrollment.fullName': data.fullName,
        'enrollment.dob': data.dob,
        'enrollment.gender': data.gender,
        'enrollment.mobile': data.mobile,
        'enrollment.personalEmail': data.personalEmail,
        'enrollment.address': data.address,
        'enrollment.permanentAddress': data.permanentAddress,
        'enrollment.aadhaarNumber': data.aadhaarNumber,
        'enrollment.panNumber': data.panNumber,
        'enrollment.emergencyContact': data.emergencyContact,
        'enrollment.banking': data.banking,
        'enrollment.highestQualification': data.highestQualification,
        'enrollment.education': data.education,
        'enrollment.skills': data.skills,
        'enrollment.startDate': data.startDate,
        'enrollment.submittedAt': serverTimestamp(),
        'enrollment.status': 'pending'
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async reviewEnrollment(uid: string, result: 'approved' | 'declined', stipend?: any): Promise<void> {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      if (result === 'approved') {
        await updateDoc(docRef, {
          'enrollment.status': 'approved',
          'enrollment.stipend': stipend,
          'enrollment.onboarding': {
            offerLetterUrl: 'https://example.com/assets/generic_offer_letter.pdf', // Mock template
            onboardingStatus: 'awaiting_intern_signature'
          }
        });
        console.log(`Sending internship offer letter to user ${uid}`);
      } else {
        await updateDoc(docRef, {
          'enrollment.status': 'declined',
          status: 'denied'
        });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async submitOnboardingDocs(uid: string, data: { signedOfferLetterUrl: string, signedNdaUrl: string }): Promise<void> {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, {
        'enrollment.onboarding.signedOfferLetterUrl': data.signedOfferLetterUrl,
        'enrollment.onboarding.signedNdaUrl': data.signedNdaUrl,
        'enrollment.onboarding.policiesAccepted': true,
        'enrollment.onboarding.onboardingStatus': 'completed'
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async createLog(log: Omit<SystemLog, 'id' | 'timestamp'>): Promise<void> {
    const path = 'logs';
    try {
      await addDoc(collection(db, path), {
        ...log,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  },

  async getLogs(): Promise<SystemLog[]> {
    const path = 'logs';
    try {
      const q = query(collection(db, path), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SystemLog));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
      return [];
    }
  }
};
