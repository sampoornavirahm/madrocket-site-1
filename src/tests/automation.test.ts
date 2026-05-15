import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeApp, deleteApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  deleteUser,
  signInAnonymously,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  doc,
  setDoc,
  updateDoc,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Test configuration
const TEST_PREFIX = 'AUTOTEST_';
const PASS = '123456';

interface TestUser {
  uid: string;
  email: string;
  role: 'admin' | 'manager' | 'sales';
  team?: string;
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

describe('Simultaneous 9-User Automation Test', () => {
  let testUsers: TestUser[] = [];
  const report: string[] = [];

  const log = (msg: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const formatted = `[${timestamp}] ${msg}`;
    console.log(formatted);
    report.push(formatted);
  };

  beforeAll(async () => {
    log('--- STARTING PREPARATION PHASE ---');
    
    const roles = [
      { role: 'admin' }, { role: 'admin' }, { role: 'admin' },
      { role: 'manager', team: 'Team-X' }, { role: 'sales', team: 'Team-X' },
      { role: 'manager', team: 'Team-Y' }, { role: 'sales', team: 'Team-Y' },
      { role: 'manager', team: 'Team-Z' }, { role: 'sales', team: 'Team-Z' },
    ] as const;

    // Create 9 separate app instances for 9 concurrent auth states
    const setupTasks = roles.map(async (untypedCfg, i) => {
      const cfg = untypedCfg as { role: string, team?: string };
      const appName = `${TEST_PREFIX}app${i}`;
      const app = initializeApp(firebaseConfig, appName);
      const auth = getAuth(app);
      const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

      try {
        log(`Signing in anonymously for user ${i} (${cfg.role})`);
        const userCred = await signInAnonymously(auth);
        const uid = userCred.user.uid;

        // Create user profile in Firestore
        await setDoc(doc(db, 'users', uid), {
          uid,
          email: `${TEST_PREFIX}anon${i}@test.com`,
          role: cfg.role,
          status: 'active',
          team: cfg.team || null,
          name: `Test ${cfg.role} ${i}`,
          createdAt: new Date()
        });

        return { uid, email: `${TEST_PREFIX}anon${i}@test.com`, role: cfg.role as any, team: cfg.team, app, auth, db };
      } catch (err: any) {
        throw err;
      }
    });

    testUsers = await Promise.all(setupTasks);
    log('--- PREPARATION PHASE COMPLETE ---');
  }, 60000); // 60s timeout for setup

  it('Performs simultaneous multi-role operations', async () => {
    log('--- STARTING SIMULTANEOUS OPERATIONS ---');
    
    const salesUsers = testUsers.filter(u => u.role === 'sales');
    const managerUsers = testUsers.filter(u => u.role === 'manager');
    const adminUsers = testUsers.filter(u => u.role === 'admin');

    // 1. Concurrent Lead Creation by Sales
    log('Step 1: Sales users creating leads concurrently...');
    const creationTasks = salesUsers.map(async (user, idx) => {
      const leadData = {
        name: `Lead ${idx} by ${user.uid.slice(0,4)}`,
        email: `${TEST_PREFIX}lead${idx}@domain.com`,
        phone: '123456789',
        company: 'AutoTest Inc',
        status: 'New',
        salesRepId: user.uid,
        salesRepName: `Test Sales ${idx}`,
        team: user.team,
        notes: 'Automatically generated lead',
        schoolName: `Test School ${idx}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const docRef = await addDoc(collection(user.db, 'leads'), leadData);
      log(`Sales ${user.uid.slice(0,4)} created lead ID: ${docRef.id}`);
      return docRef.id;
    });

    const leadIds = await Promise.all(creationTasks);
    expect(leadIds.length).toBe(salesUsers.length);

    // 2. Concurrent Status Updates by Managers
    log('Step 2: Managers updating lead statuses...');
    const updateTasks = managerUsers.map(async (manager) => {
      // Find leads for this manager's team
      const q = query(collection(manager.db, 'leads'), where('team', '==', manager.team));
      const snap = await getDocs(q);
      const teamLeadTasks = snap.docs.map(async (lDoc) => {
        await updateDoc(doc(manager.db, 'leads', lDoc.id), {
          status: 'Contacted',
          updatedAt: new Date(),
          notes: `Updated by manager ${manager.uid.slice(0,4)}`
        });
        log(`Manager ${manager.uid.slice(0,4)} updated lead ${lDoc.id} status to Contacted`);
      });
      return Promise.all(teamLeadTasks);
    });
    await Promise.all(updateTasks);

    // 3. Admin Verification
    log('Step 3: Admins verifying global state...');
    const adminChecks = adminUsers.map(async (admin) => {
      const snap = await getDocs(collection(admin.db, 'leads'));
      const autoLeads = snap.docs.filter(d => d.data().email.startsWith(TEST_PREFIX.toLowerCase()));
      log(`Admin ${admin.uid.slice(0,4)} verified ${autoLeads.length} test leads in system`);
      expect(autoLeads.length).toBeGreaterThanOrEqual(salesUsers.length);
    });
    await Promise.all(adminChecks);

    log('--- SIMULTANEOUS OPERATIONS COMPLETE ---');
  }, 30000);

  afterAll(async () => {
    log('--- STARTING CLEANUP PHASE ---');
    
    if (testUsers.length > 0) {
      const admin = testUsers.find(u => u.role === 'admin')!;
      
      // 1. Delete Leads
      const leadsSnap = await getDocs(collection(admin.db, 'leads'));
      const leadsToDelete = leadsSnap.docs.filter(d => d.data().email && d.data().email.startsWith(TEST_PREFIX.toLowerCase()));
      log(`Deleting ${leadsToDelete.length} test leads...`);
      await Promise.all(leadsToDelete.map(d => deleteDoc(doc(admin.db, 'leads', d.id))));

      // 2. Delete User Profiles and Auth Accounts
      log(`Deleting ${testUsers.length} test users...`);
      const cleanupTasks = testUsers.map(async (user) => {
        try {
          // Delete firestore profile
          await deleteDoc(doc(admin.db, 'users', user.uid));
          // Delete auth user
          // Note: client SDK can only delete current user
          await deleteUser(user.auth.currentUser!);
          // Delete app instance
          await deleteApp(user.app);
        } catch (e) {
          // Ignore failures in cleanup
        }
      });
      await Promise.all(cleanupTasks);
    }

    log('--- CLEANUP PHASE COMPLETE ---');
    log('Final Report:\n' + report.join('\n'));
    
    // Create a physical report file
    // In this environment, I have to handle file creation separately
  }, 60000);
});
