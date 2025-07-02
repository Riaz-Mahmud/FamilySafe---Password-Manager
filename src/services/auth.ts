
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { addDeviceSession, revokeDeviceSession } from './firestore';

const googleProvider = new GoogleAuthProvider();

export async function signUp(email: string, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

export async function signIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const sessionId = await addDeviceSession(user.uid, navigator.userAgent);
    localStorage.setItem('sessionId', sessionId);
    return user;
}

export async function signInWithGoogle(): Promise<User> {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const user = userCredential.user;
    const sessionId = await addDeviceSession(user.uid, navigator.userAgent);
    localStorage.setItem('sessionId', sessionId);
    return user;
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
