
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
  getDoc,
  where,
  limit,
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
          createdAt: formatTimestamp(data.createdAt),
          sharedWith: data.sharedWith || [],
          icon: data.icon,
          tags: data.tags || [],
          expiryMonths: data.expiryMonths,
          safeForTravel: data.safeForTravel || false,
          isShared: data.isShared || false,
          sharedTo: data.sharedTo || undefined,
        } as Credential;
    });
    callback(credentials);
  }, (error) => {
    console.error("Error fetching credentials:", error);
    callback([]);
  });

  return unsubscribe;
}

export async function addCredential(userId: string, credential: Omit<Credential, 'id' | 'lastModified' | 'createdAt'>): Promise<void> {
  const credentialsCol = collection(db, 'users', userId, 'credentials');
  
  const encryptedCredential = {
    ...credential,
    username: encryptData(credential.username, userId),
    password: encryptData(credential.password, userId),
    notes: encryptData(credential.notes || '', userId),
    tags: credential.tags || [],
    expiryMonths: credential.expiryMonths || null,
    safeForTravel: credential.safeForTravel || false,
    isShared: credential.isShared || false,
    sharedTo: credential.sharedTo || null,
    createdAt: serverTimestamp(),
    lastModified: serverTimestamp(),
  };

  await addDoc(credentialsCol, encryptedCredential);
}

export async function updateCredential(userId: string, id: string, credential: Partial<Omit<Credential, 'id' | 'createdAt'>>): Promise<void> {
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
  if (credential.hasOwnProperty('expiryMonths')) {
    encryptedUpdate.expiryMonths = credential.expiryMonths || null;
  }
  if (credential.hasOwnProperty('safeForTravel')) {
    encryptedUpdate.safeForTravel = credential.safeForTravel || false;
  }
  if (credential.hasOwnProperty('isShared')) {
    encryptedUpdate.isShared = credential.isShared || false;
  }
  if (credential.hasOwnProperty('sharedTo')) {
    encryptedUpdate.sharedTo = credential.sharedTo || null;
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
    const members = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id,
            ...data,
            status: data.status || 'pending',
            email: data.email || undefined,
        } as FamilyMember
    });
    callback(members);
  }, (error) => {
    console.error("Error fetching family members:", error);
    callback([]);
  });
  return unsubscribe;
}

export async function addFamilyMember(userId: string, member: Omit<FamilyMember, 'id' | 'uid'>): Promise<void> {
  const familyMembersCol = collection(db, 'users', userId, 'familyMembers');
  
  // Firestore does not allow `undefined` values. Create a clean object.
  const dataToAdd: { name: string; status: 'pending' | 'active' | 'local'; avatar: string; email?: string } = {
    name: member.name,
    status: member.status,
    avatar: member.avatar,
  };

  if (member.email) {
    dataToAdd.email = member.email;
  }

  const familyMemberDocRef = await addDoc(familyMembersCol, dataToAdd);

  // If there's an email, it's an invitation. Local members don't get added to the invitations collection.
  if (member.email) {
    const invitationsCol = collection(db, 'invitations');
    await addDoc(invitationsCol, {
      referrerId: userId,
      inviteeEmail: member.email,
      familyMemberDocId: familyMemberDocRef.id,
    });
  }
}

export async function updateFamilyMember(userId: string, id: string, member: Partial<FamilyMember>): Promise<void> {
  const docRef = doc(db, 'users', userId, 'familyMembers', id);
  const dataToUpdate = { ...member };
  if (dataToUpdate.email === '') {
      delete dataToUpdate.email;
  }
  await updateDoc(docRef, dataToUpdate);
}

export async function deleteFamilyMember(userId: string, id: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'familyMembers', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const memberData = docSnap.data();
    await deleteDoc(docRef);

    // If they were pending or active (i.e., had an email), also delete the corresponding invitation document if it exists
    if (memberData.status !== 'local' && memberData.email) {
        const invitationsCol = collection(db, 'invitations');
        // We can find the invitation using the familyMemberDocId
        const q = query(invitationsCol, where("familyMemberDocId", "==", id));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (invitationDoc) => {
            await deleteDoc(invitationDoc.ref);
        });
    }
  }
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
  
  // Check if a session for this device (user agent) already exists.
  const q = query(sessionsCol, where('userAgent', '==', userAgent), limit(1));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    // If it exists, update the lastSeen timestamp and return the existing session ID.
    const existingSession = querySnapshot.docs[0];
    await updateDoc(existingSession.ref, {
      lastSeen: serverTimestamp(),
    });
    return existingSession.id;
  } else {
    // If it doesn't exist, create a new session document.
    const docRef = await addDoc(sessionsCol, {
      userAgent,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
    });
    return docRef.id;
  }
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

// --- Referrals & Invitations ---

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

export async function findAndActivateByEmail(newUserUid: string, newUserEmail: string): Promise<void> {
    if (!newUserEmail) return;

    const invitationsCol = collection(db, 'invitations');
    // Find an invitation that matches the new user's email
    const q = query(invitationsCol, where("inviteeEmail", "==", newUserEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.log(`No pending invitations found for ${newUserEmail}.`);
        return;
    }

    // Process all matching invitations (should typically be one)
    for (const invitationDoc of querySnapshot.docs) {
        const invitationData = invitationDoc.data();
        const { referrerId, familyMemberDocId } = invitationData;

        // Get the reference to the original familyMember document in the referrer's subcollection
        const familyMemberDocRef = doc(db, 'users', referrerId, 'familyMembers', familyMemberDocId);
        
        // Update the family member to be active and link the new user's UID
        await updateDoc(familyMemberDocRef, {
            status: 'active',
            uid: newUserUid,
        });

        // Record the referral for the inviter
        await recordReferral(referrerId, newUserUid);

        // Clean up the invitation document so it can't be used again
        await deleteDoc(invitationDoc.ref);
        
        console.log(`Successfully activated family member for ${newUserEmail}.`);
    }
}

// --- User Data Management ---

async function deleteCollection(collectionPath: string): Promise<void> {
  const collectionRef = collection(db, collectionPath);
  const q = query(collectionRef);
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return;
  }

  const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletePromises);
}

export async function deleteUserData(userId: string): Promise<void> {
  // Delete all invitations sent by this user.
  const invitationsRef = collection(db, 'invitations');
  const userInvitationsQuery = query(invitationsRef, where('referrerId', '==', userId));
  const userInvitationsSnap = await getDocs(userInvitationsQuery);
  if (!userInvitationsSnap.empty) {
    const deleteInvitationPromises = userInvitationsSnap.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deleteInvitationPromises);
  }
  
  // Delete all subcollections under the user's document.
  const subcollections = ['credentials', 'familyMembers', 'auditLogs', 'sessions', 'successful_referrals'];
  const deleteSubCollectionPromises = subcollections.map(sub => deleteCollection(`users/${userId}/${sub}`));
  await Promise.all(deleteSubCollectionPromises);

  // Finally, delete the user's main document.
  const userDocRef = doc(db, 'users', userId);
  await deleteDoc(userDocRef);
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
            createdAt: formatTimestamp(data.createdAt),
            sharedWith: data.sharedWith || [],
            icon: data.icon,
            tags: data.tags || [],
            expiryMonths: data.expiryMonths,
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


// --- Sharing ---

export async function createShare(shareData: { fromUid: string, fromName: string, toEmail: string, credential: any }): Promise<void> {
  const sharesCol = collection(db, 'shares');
  await addDoc(sharesCol, {
    ...shareData,
    createdAt: serverTimestamp(),
  });
}

export function getSharesForUser(email: string, callback: (shares: any[]) => void): () => void {
  const sharesCol = collection(db, 'shares');
  const q = query(sharesCol, where("toEmail", "==", email));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const shares = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    }));
    callback(shares);
  }, (error) => {
    console.error("Error fetching shares:", error);
    callback([]);
  });

  return unsubscribe;
}

export async function deleteShare(shareId: string): Promise<void> {
  const docRef = doc(db, 'shares', shareId);
  await deleteDoc(docRef);
}
