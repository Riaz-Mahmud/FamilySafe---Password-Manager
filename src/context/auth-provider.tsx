
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { addDeviceSession, updateSessionLastSeen, findAndActivateByEmail, addAuditLog } from '@/services/firestore';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({ 
    user: null, 
    loading: true, 
    refreshUser: async () => {} 
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    await auth.currentUser?.reload();
    const freshUser = auth.currentUser;
    // Create a new object from the reloaded user to ensure React detects the state change,
    // preserving the User object's prototype and methods.
    setUser(freshUser ? Object.assign(Object.create(Object.getPrototypeOf(freshUser)), freshUser) : null);
  };

  useEffect(() => {
    let unsubscribeSession: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (unsubscribeSession) {
        unsubscribeSession();
      }

      if (currentUser) {
        // This is the key logic: we check for a session ID in local storage.
        // Its absence indicates a fresh login for this browser instance.
        const sessionIdFromStorage = localStorage.getItem('sessionId');
        let sessionId = sessionIdFromStorage;

        if (!sessionId) {
          // No session ID means this is a new login.
          // Create session, add audit log, and check for invitations.
          sessionId = await addDeviceSession(currentUser.uid, navigator.userAgent);
          localStorage.setItem('sessionId', sessionId);
          await addAuditLog(currentUser.uid, 'User Signed In', `User signed in with ${currentUser.providerData[0]?.providerId || 'email'}.`);
          
          if (currentUser.email) {
            await findAndActivateByEmail(currentUser.uid, currentUser.email);
          }
        }
        
        // For every auth state change where the user is logged in,
        // ensure we update their last seen time and listen for remote sign-out.
        if (sessionId) {
          updateSessionLastSeen(currentUser.uid, sessionId);
          
          const sessionRef = doc(db, 'users', currentUser.uid, 'sessions', sessionId);
          unsubscribeSession = onSnapshot(sessionRef, (doc) => {
            if (!doc.exists()) {
              // This session has been revoked remotely. Sign the user out.
              signOut(auth);
              localStorage.removeItem('sessionId');
            }
          });
        }
      } else {
        // User is signed out, clear the session ID.
        localStorage.removeItem('sessionId');
      }
    });

    return () => {
        unsubscribeAuth();
        if (unsubscribeSession) {
            unsubscribeSession();
        }
    };
  }, []);
  
  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
