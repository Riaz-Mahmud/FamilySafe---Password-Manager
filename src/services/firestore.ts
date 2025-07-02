
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
} from 'firebase/firestore';

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
          username: data.username,
          password: data.password,
          notes: data.notes,
          lastModified: formatTimestamp(data.lastModified),
          sharedWith: data.sharedWith || [],
          icon: data.icon,
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
  await addDoc(credentialsCol, {
    ...credential,
    lastModified: serverTimestamp(),
  });
}

export async function updateCredential(userId: string, id: string, credential: Partial<Omit<Credential, 'id'>>): Promise<void> {
  const docRef = doc(db, 'users', userId, 'credentials', id);
  await updateDoc(docRef, {
      ...credential,
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
