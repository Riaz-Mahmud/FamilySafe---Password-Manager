
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  type User,
  deleteUser,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { revokeDeviceSession } from './firestore';

const googleProvider = new GoogleAuthProvider();

export async function signUp(email: string, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

export async function signIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

export async function signInWithGoogle(): Promise<User> {
    const userCredential = await signInWithPopup(auth, googleProvider);
    return userCredential.user;
}

export async function signOutUser(): Promise<void> {
    const sessionId = localStorage.getItem('sessionId');
    if (auth.currentUser && sessionId) {
        await revokeDeviceSession(auth.currentUser.uid, sessionId);
    }
    localStorage.removeItem('sessionId');
    await signOut(auth);
}

export async function sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
}

export async function updateUserProfile(profile: { displayName?: string; photoURL?: string }): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Not authenticated. Cannot update profile.');
  }
  await updateProfile(auth.currentUser, profile);
}

export async function deleteCurrentUser(): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('No user is currently signed in to be deleted.');
    }
    await deleteUser(user);
}

export async function checkIfEmailExists(email: string): Promise<boolean> {
    try {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        return methods.length > 0;
    } catch (error) {
        console.error("Error checking email existence:", error);
        // Default to false on error to avoid blocking the user flow.
        return false;
    }
}
