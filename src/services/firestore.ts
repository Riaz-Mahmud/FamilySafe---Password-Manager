
import { db } from '@/lib/firebase';
import type { Credential, FamilyMember, AuditLog, DeviceSession } from '@/types';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  query,
  orderBy,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { encryptData, decryptData } from '@/lib/crypto';

// --- Helpers ---

function formatTimestamp(timestamp: Timestamp | undefined): string {
  if (!timestamp) return new Date().toLocaleString();
  return new Date(timestamp.seconds * 1000).toLocaleString();
}


// --- Credentials ---

export function getCredentials(userId: string, callback: (credentials: Credential[]) => void): () => void {
  const credentialsCol = collection(db, 'users', userId, 'credentials');
  const q = query(credentialsCol, orderBy('lastModified', 'desc'));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const credentials = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          url: data.url,
          username: decryptData(data.username, userId),
          password: decryptData(data.password, userId),
          notes: decryptData(data.notes, userId),
          lastModified: formatTimestamp(data.lastModified),
          sharedWith: data.sharedWith || [],
          icon: data.icon,
          tags: data.tags || [],
        } as Credential;
    });
    callback(credentials);
  }, (error) => {
    console.error("Error fetching credentials:", error);
    callback([]);
  });

  return unsubscribe;
}

export async function addCredential(userId: string, credential: Omit<Credential, 'id' | 'lastModified'>): Promise<void> {
  const credentialsCol = collection(db, 'users', userId, 'credentials');
  
  const encryptedCredential = {
    ...credential,
    username: encryptData(credential.username, userId),
    password: encryptData(credential.password, userId),
    notes: encryptData(credential.notes || '', userId),
    tags: credential.tags || [],
    lastModified: serverTimestamp(),
  };

  await addDoc(credentialsCol, encryptedCredential);
}

export async function updateCredential(userId: string, id: string, credential: Partial<Omit<Credential, 'id'>>): Promise<void> {
  const docRef = doc(db, 'users', userId, 'credentials', id);
  
  const encryptedUpdate: { [key: string]: any } = { ...credential };
  if (credential.username) {
    encryptedUpdate.username = encryptData(credential.username, userId);
  }
  if (credential.password) {
    encryptedUpdate.password = encryptData(credential.password, userId);
  }
  if (credential.hasOwnProperty('notes')) {
    encryptedUpdate.notes = encryptData(credential.notes || '', userId);
  }

  await updateDoc(docRef, {
      ...encryptedUpdate,
      lastModified: serverTimestamp(),
  });
}

export async function deleteCredential(userId: string, id: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'credentials', id);
  await deleteDoc(docRef);
}

// --- Family Members ---

export function getFamilyMembers(userId: string, callback: (familyMembers: FamilyMember[]) => void): () => void {
  const familyMembersCol = collection(db, 'users', userId, 'familyMembers');
  const unsubscribe = onSnapshot(familyMembersCol, (snapshot) => {
    const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FamilyMember));
    callback(members);
  }, (error) => {
    console.error("Error fetching family members:", error);
    callback([]);
  });
  return unsubscribe;
}

export async function addFamilyMember(userId: string, member: Omit<FamilyMember, 'id'>): Promise<void> {
  const familyMembersCol = collection(db, 'users', userId, 'familyMembers');
  await addDoc(familyMembersCol, member);
}

export async function updateFamilyMember(userId: string, id: string, member: Partial<FamilyMember>): Promise<void> {
  const docRef = doc(db, 'users', userId, 'familyMembers', id);
  await updateDoc(docRef, member);
}

export async function deleteFamilyMember(userId: string, id: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'familyMembers', id);
  await deleteDoc(docRef);
}


// --- Audit Logs ---

export async function addAuditLog(userId: string, action: string, description: string): Promise<void> {
    const auditLogsCol = collection(db, 'users', userId, 'auditLogs');
    try {
        await addDoc(auditLogsCol, {
            action,
            description,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error adding audit log:", error);
    }
}

export function getAuditLogs(userId: string, callback: (logs: AuditLog[]) => void): () => void {
    const auditLogsCol = collection(db, 'users', userId, 'auditLogs');
    const q = query(auditLogsCol, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                action: data.action,
                description: data.description,
                timestamp: formatTimestamp(data.timestamp),
            } as AuditLog;
        });
        callback(logs);
    }, (error) => {
        console.error("Error fetching audit logs:", error);
        callback([]);
    });

    return unsubscribe;
}

// --- Device Sessions ---

export async function addDeviceSession(userId: string, userAgent: string): Promise<string> {
  const sessionsCol = collection(db, 'users', userId, 'sessions');
  const docRef = await addDoc(sessionsCol, {
    userAgent,
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateSessionLastSeen(userId: string, sessionId: string): Promise<void> {
  if (!userId || !sessionId) return;
  const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
  await updateDoc(sessionRef, { lastSeen: serverTimestamp() }).catch(err => {
    // This can fail if the doc was just deleted by a revoke action. Ignore.
  });
}

export function getDeviceSessions(
  userId: string,
  currentSessionId: string | null,
  callback: (sessions: DeviceSession[]) => void
): () => void {
  const sessionsCol = collection(db, 'users', userId, 'sessions');
  const q = query(sessionsCol, orderBy('lastSeen', 'desc'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userAgent: data.userAgent,
        createdAt: formatTimestamp(data.createdAt),
        lastSeen: formatTimestamp(data.lastSeen),
        isCurrent: doc.id === currentSessionId,
      } as DeviceSession;
    });
    callback(sessions);
  }, (error) => {
    console.error("Error fetching device sessions:", error);
    callback([]);
  });

  return unsubscribe;
}

export async function revokeDeviceSession(userId: string, sessionId: string): Promise<void> {
  const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
  await deleteDoc(sessionRef);
}

// --- Referrals ---

export async function recordReferral(referrerId: string, referredUid: string): Promise<void> {
  if (referrerId === referredUid) return; // Can't refer yourself
  const referralsCol = collection(db, 'users', referrerId, 'successful_referrals');
  await addDoc(referralsCol, {
    referredUid,
    timestamp: serverTimestamp(),
  });
}

export function getReferralCount(userId: string, callback: (count: number) => void): () => void {
  const referralsCol = collection(db, 'users', userId, 'successful_referrals');
  const unsubscribe = onSnapshot(referralsCol, (snapshot) => {
    callback(snapshot.size);
  }, (error) => {
    console.error("Error fetching referral count:", error);
    callback(0);
  });
  return unsubscribe;
}


// --- Data Export ---

export async function getUserDataForExport(userId: string): Promise<object> {
    const credentialsCol = collection(db, 'users', userId, 'credentials');
    const familyMembersCol = collection(db, 'users', userId, 'familyMembers');
    const auditLogsCol = collection(db, 'users', userId, 'auditLogs');
    const sessionsCol = collection(db, 'users', userId, 'sessions');
    const referralsCol = collection(db, 'users', userId, 'successful_referrals');


    const [credentialsSnap, familyMembersSnap, auditLogsSnap, sessionsSnap, referralsSnap] = await Promise.all([
        getDocs(query(credentialsCol, orderBy('lastModified', 'desc'))),
        getDocs(familyMembersCol),
        getDocs(query(auditLogsCol, orderBy('timestamp', 'desc'))),
        getDocs(query(sessionsCol, orderBy('lastSeen', 'desc'))),
        getDocs(query(referralsCol, orderBy('timestamp', 'desc'))),
    ]);

    const credentials = credentialsSnap.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            url: data.url,
            username: decryptData(data.username, userId),
            password: decryptData(data.password, userId),
            notes: decryptData(data.notes, userId),
            lastModified: formatTimestamp(data.lastModified),
            sharedWith: data.sharedWith || [],
            icon: data.icon,
            tags: data.tags || [],
        };
    });

    const familyMembers = familyMembersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const auditLogs = auditLogsSnap.docs.map(doc => {
         const data = doc.data();
         return {
            id: doc.id,
            action: data.action,
            description: data.description,
            timestamp: formatTimestamp(data.timestamp),
        };
    });

    const deviceSessions = sessionsSnap.docs.map(doc => {
         const data = doc.data();
         return {
            id: doc.id,
            userAgent: data.userAgent,
            createdAt: formatTimestamp(data.createdAt),
            lastSeen: formatTimestamp(data.lastSeen),
         };
    });

    const referrals = referralsSnap.docs.map(doc => {
        const data = doc.data();
        return {
           id: doc.id,
           referredUid: data.referredUid,
           timestamp: formatTimestamp(data.timestamp),
        };
    });
    
    return {
        credentials,
        familyMembers,
        auditLogs,
        deviceSessions,
        referrals,
    };
}
