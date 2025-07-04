







import { db } from '@/lib/firebase';
import type { Credential, FamilyMember, AuditLog, DeviceSession, SecureDocument, Vault, Notification } from '@/types';
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
  writeBatch,
  setDoc,
} from 'firebase/firestore';
import { encryptData, decryptData, sha256 } from '@/lib/crypto';

// --- Helpers ---

function formatTimestamp(timestamp: Timestamp | undefined): string {
  if (!timestamp) return new Date().toLocaleString();
  return new Date(timestamp.seconds * 1000).toLocaleString();
}


// --- Vaults ---

export function getVaults(userId: string, callback: (vaults: Vault[]) => void): () => void {
  const vaultsCol = collection(db, 'users', userId, 'vaults');
  const q = query(vaultsCol, orderBy('name'));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const vaultsFromDb = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Vault));
    callback(vaultsFromDb);
  }, (error) => {
    console.error("Error fetching vaults:", error);
    callback([]);
  });
  return unsubscribe;
}

export async function createVault(userId: string, name: string): Promise<string> {
  const vaultsCol = collection(db, 'users', userId, 'vaults');
  const docRef = await addDoc(vaultsCol, {
    name,
    ownerUid: userId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getOrCreatePersonalVault(userId: string): Promise<Vault> {
  const vaultsCol = collection(db, 'users', userId, 'vaults');
  const q = query(vaultsCol, where('name', '==', 'Personal'), limit(1));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const vaultDoc = snapshot.docs[0];
    return { id: vaultDoc.id, ...vaultDoc.data() } as Vault;
  } else {
    const newVaultId = await createVault(userId, 'Personal');
    const newVaultRef = doc(db, 'users', userId, 'vaults', newVaultId);
    const newVaultSnap = await getDoc(newVaultRef);
    return { id: newVaultSnap.id, ...newVaultSnap.data() } as Vault;
  }
}

export async function updateVault(userId: string, vaultId: string, name: string): Promise<void> {
  const vaultRef = doc(db, 'users', userId, 'vaults', vaultId);
  await updateDoc(vaultRef, { name });
}

export async function deleteVault(userId: string, vaultId: string): Promise<void> {
  const batch = writeBatch(db);

  // Delete all credentials in the vault
  const credsCol = collection(db, 'users', userId, 'credentials');
  const credsQuery = query(credsCol, where('vaultId', '==', vaultId));
  const credsSnapshot = await getDocs(credsQuery);
  credsSnapshot.forEach(doc => batch.delete(doc.ref));

  // Delete all secure documents in the vault
  const docsCol = collection(db, 'users', userId, 'secureDocuments');
  const docsQuery = query(docsCol, where('vaultId', '==', vaultId));
  const docsSnapshot = await getDocs(docsQuery);
  docsSnapshot.forEach(doc => batch.delete(doc.ref));
  
  // Delete the vault document itself
  const vaultRef = doc(db, 'users', userId, 'vaults', vaultId);
  batch.delete(vaultRef);

  await batch.commit();
}


// --- Credentials ---

export function getCredentials(userId: string, callback: (credentials: Credential[]) => void): () => void {
  const credentialsCol = collection(db, 'users', userId, 'credentials');
  const q = query(credentialsCol);
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const credentialsFromDb = snapshot.docs.map(doc => {
        const data = doc.data();
        // The current user (userId) is always the key for decryption.
        const key = userId;
        return {
          id: doc.id,
          url: data.url,
          username: decryptData(data.username, key),
          password: decryptData(data.password, key),
          notes: decryptData(data.notes, key),
          lastModified: data.lastModified?.toDate(),
          createdAt: data.createdAt?.toDate(),
          icon: data.icon,
          tags: data.tags || [],
          expiryMonths: data.expiryMonths,
          safeForTravel: data.safeForTravel || false,
          vaultId: data.vaultId,
          sharedWith: data.sharedWith || [],
          ownerId: data.ownerId,
          ownerName: data.ownerName,
          originalId: data.originalId,
        } as Credential;
    });
     // Sort client-side to avoid needing a composite index
    credentialsFromDb.sort((a,b) => (b.lastModified?.getTime() || 0) - (a.lastModified?.getTime() || 0));
    callback(credentialsFromDb);
  }, (error) => {
    console.error("Error fetching credentials:", error);
    callback([]);
  });

  return unsubscribe;
}

export async function addCredential(userId: string, vaultId: string, credential: Omit<Credential, 'id' | 'lastModified' | 'createdAt' | 'vaultId'>): Promise<string> {
  const credentialsCol = collection(db, 'users', userId, 'credentials');
  
  const encryptedCredential = {
    ...credential,
    vaultId,
    username: encryptData(credential.username, userId),
    password: encryptData(credential.password, userId),
    notes: encryptData(credential.notes || '', userId),
    tags: credential.tags || [],
    expiryMonths: credential.expiryMonths || null,
    safeForTravel: credential.safeForTravel || false,
    sharedWith: credential.sharedWith || [],
    createdAt: serverTimestamp(),
    lastModified: serverTimestamp(),
  };

  const docRef = await addDoc(credentialsCol, encryptedCredential);
  return docRef.id;
}

export async function updateCredential(userId: string, id: string, credential: Partial<Omit<Credential, 'id' | 'createdAt'>>): Promise<void> {
  const docRef = doc(db, 'users', userId, 'credentials', id);
  
  const dataToUpdate = { ...credential };
  
  if (dataToUpdate.username) {
    dataToUpdate.username = encryptData(dataToUpdate.username, userId);
  }
  if (dataToUpdate.password) {
    dataToUpdate.password = encryptData(dataToUpdate.password, userId);
  }
  if (dataToUpdate.hasOwnProperty('notes')) {
    dataToUpdate.notes = encryptData(dataToUpdate.notes || '', userId);
  }
  
  // Clean up any undefined fields before sending to Firestore
  Object.keys(dataToUpdate).forEach(key => {
      const typedKey = key as keyof typeof dataToUpdate;
      if (dataToUpdate[typedKey] === undefined) {
          delete dataToUpdate[typedKey];
      }
  });

  await updateDoc(docRef, {
      ...dataToUpdate,
      lastModified: serverTimestamp(),
  });
}

export async function deleteCredential(userId: string, id: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'credentials', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    console.error(`Credential with id ${id} not found for user ${userId} to delete.`);
    return;
  }

  const credential = docSnap.data();

  // If this is a shared item someone else owns, just delete our copy.
  // Owners cannot delete shared items from the shared list, UI prevents this.
  // This is just a safeguard.
  if (credential.ownerId) {
    await deleteDoc(docRef);
    return;
  }

  // If we are the owner, we need to delete the copies shared with others.
  const batch = writeBatch(db);

  if (credential.sharedWith && credential.sharedWith.length > 0) {
    const familyMembersCol = collection(db, 'users', userId, 'familyMembers');
    const familyMembersSnap = await getDocs(familyMembersCol);
    const familyMembers = familyMembersSnap.docs.map(d => ({ id: d.id, ...d.data() } as FamilyMember));
    
    const recipientUids = credential.sharedWith
      .map((memberId: string) => familyMembers.find(fm => fm.id === memberId)?.uid)
      .filter((uid: string | undefined): uid is string => !!uid);

    await Promise.all(recipientUids.map(async (recipientUid) => {
      const sharedCredsCol = collection(db, 'users', recipientUid, 'credentials');
      const q = query(sharedCredsCol, where('originalId', '==', id));
      const sharedDocsSnap = await getDocs(q);
      sharedDocsSnap.forEach(sharedDoc => {
        batch.delete(sharedDoc.ref);
      });
    }));
  }

  // Finally, delete the original credential
  batch.delete(docRef);

  await batch.commit();
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
    const q = query(auditLogsCol);

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                action: data.action,
                description: data.description,
                timestamp: data.timestamp?.toDate(),
            } as AuditLog;
        });
        logs.sort((a,b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
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
  const q = query(sessionsCol);

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userAgent: data.userAgent,
        createdAt: data.createdAt?.toDate(),
        lastSeen: data.lastSeen?.toDate(),
        isCurrent: doc.id === currentSessionId,
      } as DeviceSession;
    });
    sessions.sort((a,b) => (b.lastSeen?.getTime() || 0) - (a.lastSeen?.getTime() || 0));
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

// --- Secure Documents ---

export function getSecureDocuments(userId: string, callback: (documents: SecureDocument[]) => void): () => void {
  const documentsCol = collection(db, 'users', userId, 'secureDocuments');
  const q = query(documentsCol);
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const documents = snapshot.docs.map(doc => {
        const data = doc.data();
        const key = userId; // Decryption is always done with the current user's key.
        return {
          id: doc.id,
          name: data.name,
          notes: decryptData(data.notes, key),
          fileDataUrl: decryptData(data.fileDataUrl, key),
          fileType: data.fileType,
          fileSize: data.fileSize,
          icon: data.icon,
          lastModified: data.lastModified?.toDate(),
          createdAt: data.createdAt?.toDate(),
          vaultId: data.vaultId,
          sharedWith: data.sharedWith || [],
          ownerId: data.ownerId,
          ownerName: data.ownerName,
          originalId: data.originalId,
        } as SecureDocument;
    });
    // Sort client-side to avoid needing a composite index
    documents.sort((a,b) => (b.lastModified?.getTime() || 0) - (a.lastModified?.getTime() || 0));
    callback(documents);
  }, (error) => {
    console.error("Error fetching secure documents:", error);
    callback([]);
  });

  return unsubscribe;
}

export async function addSecureDocument(userId: string, vaultId: string, documentData: Omit<SecureDocument, 'id' | 'lastModified' | 'createdAt' | 'vaultId'>): Promise<string> {
  const documentsCol = collection(db, 'users', userId, 'secureDocuments');
  
  const encryptedDocument = {
    ...documentData,
    vaultId,
    notes: encryptData(documentData.notes, userId),
    fileDataUrl: encryptData(documentData.fileDataUrl, userId),
    sharedWith: documentData.sharedWith || [],
    createdAt: serverTimestamp(),
    lastModified: serverTimestamp(),
  };

  const docRef = await addDoc(documentsCol, encryptedDocument);
  return docRef.id;
}

export async function updateSecureDocument(userId: string, id: string, documentData: Partial<Omit<SecureDocument, 'id' | 'createdAt'>>): Promise<void> {
  const docRef = doc(db, 'users', userId, 'secureDocuments', id);
  
  const dataToUpdate = { ...documentData };

  // Only encrypt fields that are present in the update
  if (dataToUpdate.notes !== undefined) {
    dataToUpdate.notes = encryptData(dataToUpdate.notes || '', userId);
  }
  if (dataToUpdate.fileDataUrl) {
    dataToUpdate.fileDataUrl = encryptData(dataToUpdate.fileDataUrl, userId);
  }
  
  // Clean up any undefined fields before sending to Firestore
  Object.keys(dataToUpdate).forEach(key => {
      const typedKey = key as keyof typeof dataToUpdate;
      if (dataToUpdate[typedKey] === undefined) {
          delete dataToUpdate[typedKey];
      }
  });

  await updateDoc(docRef, {
      ...dataToUpdate,
      lastModified: serverTimestamp(),
  });
}

export async function deleteSecureDocument(userId: string, id: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'secureDocuments', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    console.error(`Secure document with id ${id} not found for user ${userId} to delete.`);
    return;
  }

  const documentData = docSnap.data();

  // If this is a shared item someone else owns, just delete our copy.
  if (documentData.ownerId) {
    await deleteDoc(docRef);
    return;
  }

  // If we are the owner, we need to delete the copies shared with others.
  const batch = writeBatch(db);

  if (documentData.sharedWith && documentData.sharedWith.length > 0) {
    const familyMembersCol = collection(db, 'users', userId, 'familyMembers');
    const familyMembersSnap = await getDocs(familyMembersCol);
    const familyMembers = familyMembersSnap.docs.map(d => ({ id: d.id, ...d.data() } as FamilyMember));
    
    const recipientUids = documentData.sharedWith
      .map((memberId: string) => familyMembers.find(fm => fm.id === memberId)?.uid)
      .filter((uid: string | undefined): uid is string => !!uid);
    
    await Promise.all(recipientUids.map(async (recipientUid) => {
      const sharedDocsCol = collection(db, 'users', recipientUid, 'secureDocuments');
      const q = query(sharedDocsCol, where('originalId', '==', id));
      const sharedDocsSnap = await getDocs(q);
      sharedDocsSnap.forEach(sharedDoc => {
        batch.delete(sharedDoc.ref);
      });
    }));
  }

  // Finally, delete the original document
  batch.delete(docRef);

  await batch.commit();
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
  const subcollections = ['credentials', 'familyMembers', 'auditLogs', 'sessions', 'successful_referrals', 'secureDocuments', 'vaults', 'notifications'];
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
    const secureDocumentsCol = collection(db, 'users', userId, 'secureDocuments');
    const vaultsCol = collection(db, 'users', userId, 'vaults');
    const notificationsCol = collection(db, 'users', userId, 'notifications');

    const [credentialsSnap, familyMembersSnap, auditLogsSnap, sessionsSnap, referralsSnap, secureDocumentsSnap, vaultsSnap, notificationsSnap] = await Promise.all([
        getDocs(query(credentialsCol)),
        getDocs(familyMembersCol),
        getDocs(query(auditLogsCol, orderBy('timestamp', 'desc'))),
        getDocs(query(sessionsCol, orderBy('lastSeen', 'desc'))),
        getDocs(query(referralsCol, orderBy('timestamp', 'desc'))),
        getDocs(query(secureDocumentsCol)),
        getDocs(query(vaultsCol, orderBy('name'))),
        getDocs(query(notificationsCol, orderBy('createdAt', 'desc'))),
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
            icon: data.icon,
            tags: data.tags || [],
            expiryMonths: data.expiryMonths,
            vaultId: data.vaultId,
        };
    });
    
    const secureDocuments = secureDocumentsSnap.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name,
            notes: decryptData(data.notes, userId),
            // Note: fileDataUrl is intentionally not exported for security and size reasons.
            // Users should download files individually from the UI.
            fileType: data.fileType,
            fileSize: data.fileSize,
            lastModified: formatTimestamp(data.lastModified),
            createdAt: formatTimestamp(data.createdAt),
            vaultId: data.vaultId,
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

    const vaults = vaultsSnap.docs.map(doc => ({id: doc.id, ...doc.data()}));

    const notifications = notificationsSnap.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: formatTimestamp(data.createdAt),
        };
    });
    
    return {
        vaults,
        credentials,
        secureDocuments,
        familyMembers,
        auditLogs,
        deviceSessions,
        referrals,
        notifications,
    };
}


// --- Account Recovery ---
export async function saveRecoveryKeyHash(userId: string, secretKey: string): Promise<void> {
  const userDocRef = doc(db, 'users', userId);
  const keyHash = sha256(secretKey);
  // Use set with merge to create the doc if it doesn't exist, or update if it does.
  await setDoc(userDocRef, { recoveryKeyHash: keyHash }, { merge: true });
}

export async function checkRecoveryKeyExists(userId: string): Promise<boolean> {
  const userDocRef = doc(db, 'users', userId);
  try {
    const userDoc = await getDoc(userDocRef);
    return userDoc.exists() && !!userDoc.data()?.recoveryKeyHash;
  } catch (error) {
    console.error("Error checking for recovery key:", error);
    return false;
  }
}

// --- Notifications ---
export async function addNotification(userId: string, data: Omit<Notification, 'id'>): Promise<void> {
    const notificationsCol = collection(db, 'users', userId, 'notifications');
    await addDoc(notificationsCol, {
        ...data,
        createdAt: serverTimestamp(), // Use server timestamp for consistency
        read: false,
    });
}

export function getNotifications(userId: string, callback: (notifications: Notification[]) => void): () => void {
    const notificationsCol = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsCol, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
            } as Notification;
        });
        callback(notifications);
    }, (error) => {
        console.error("Error fetching notifications:", error);
        callback([]);
    });

    return unsubscribe;
}

export async function markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    const notificationsCol = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsCol, where('read', '==', false));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
    });
    await batch.commit();
}
