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
} from 'firebase/firestore';

// --- Helpers ---

function formatTimestamp(timestamp: Timestamp | undefined): string {
  if (!timestamp) return new Date().toLocaleDateString();
  return new Date(timestamp.seconds * 1000).toLocaleDateString();
}


// --- Credentials ---

const credentialsCol = collection(db, 'credentials');

export async function getCredentials(): Promise<Credential[]> {
  const snapshot = await getDocs(credentialsCol);
  return snapshot.docs.map(doc => {
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
}

export async function addCredential(credential: Omit<Credential, 'id' | 'lastModified'>): Promise<Credential> {
  const docRef = await addDoc(credentialsCol, {
    ...credential,
    lastModified: serverTimestamp(),
  });
  return {
    ...credential,
    id: docRef.id,
    lastModified: new Date().toLocaleDateString(),
  };
}

export async function updateCredential(id: string, credential: Partial<Omit<Credential, 'id'>>): Promise<void> {
  const docRef = doc(db, 'credentials', id);
  await updateDoc(docRef, {
      ...credential,
      lastModified: serverTimestamp(),
  });
}

export async function deleteCredential(id: string): Promise<void> {
  const docRef = doc(db, 'credentials', id);
  await deleteDoc(docRef);
}

// --- Family Members ---

const familyMembersCol = collection(db, 'familyMembers');

export async function getFamilyMembers(): Promise<FamilyMember[]> {
  const snapshot = await getDocs(familyMembersCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FamilyMember));
}

export async function addFamilyMember(member: Omit<FamilyMember, 'id'>): Promise<FamilyMember> {
  const docRef = await addDoc(familyMembersCol, member);
  return { ...member, id: docRef.id };
}

export async function updateFamilyMember(id: string, member: Partial<FamilyMember>): Promise<void> {
  const docRef = doc(db, 'familyMembers', id);
  await updateDoc(docRef, member);
}

export async function deleteFamilyMember(id: string): Promise<void> {
  const docRef = doc(db, 'familyMembers', id);
  await deleteDoc(docRef);
}
