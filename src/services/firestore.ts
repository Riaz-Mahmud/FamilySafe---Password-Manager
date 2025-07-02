
import { db } from '@/lib/firebase';
import type { Credential, FamilyMember } from '@/types';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  query,
  orderBy,
} from 'firebase/firestore';

// --- Helpers ---

function formatTimestamp(timestamp: Timestamp | undefined): string {
  if (!timestamp) return new Date().toLocaleDateString();
  return new Date(timestamp.seconds * 1000).toLocaleDateString();
}


// --- Credentials ---

export async function getCredentials(userId: string): Promise<Credential[]> {
  const credentialsCol = collection(db, 'users', userId, 'credentials');
  const q = query(credentialsCol, orderBy('lastModified', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        url: data.url,
        username: data.username,
        password: data.password || '',
        notes: data.notes,
        lastModified: formatTimestamp(data.lastModified),
        sharedWith: data.sharedWith || [],
        icon: data.icon,
      } as Credential;
  });
}

export async function addCredential(userId: string, credential: Omit<Credential, 'id' | 'lastModified'>): Promise<Credential> {
  const credentialsCol = collection(db, 'users', userId, 'credentials');
  const docRef = await addDoc(credentialsCol, {
    ...credential,
    lastModified: serverTimestamp(),
  });
  const newCredential = {
    ...credential,
    id: docRef.id,
    lastModified: new Date().toLocaleDateString(),
  };
  return newCredential;
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

export async function getFamilyMembers(userId: string): Promise<FamilyMember[]> {
  const familyMembersCol = collection(db, 'users', userId, 'familyMembers');
  const snapshot = await getDocs(familyMembersCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FamilyMember));
}

export async function addFamilyMember(userId: string, member: Omit<FamilyMember, 'id'>): Promise<FamilyMember> {
  const familyMembersCol = collection(db, 'users', userId, 'familyMembers');
  const docRef = await addDoc(familyMembersCol, member);
  return { ...member, id: docRef.id };
}

export async function updateFamilyMember(userId: string, id: string, member: Partial<FamilyMember>): Promise<void> {
  const docRef = doc(db, 'users', userId, 'familyMembers', id);
  await updateDoc(docRef, member);
}

export async function deleteFamilyMember(userId: string, id: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'familyMembers', id);
  await deleteDoc(docRef);
}
