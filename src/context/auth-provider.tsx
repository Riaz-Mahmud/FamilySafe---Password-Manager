
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { updateSessionLastSeen, findAndActivateByEmail } from '@/services/firestore';

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

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);

      if (unsubscribeSession) {
        unsubscribeSession();
      }

      if (user) {
        // When a user signs in, check if they have any pending invitations to activate their account.
        if (user.email) {
          await findAndActivateByEmail(user.uid, user.email);
        }

        const sessionId = localStorage.getItem('sessionId');
        if (sessionId) {
          updateSessionLastSeen(user.uid, sessionId);
          
          const sessionRef = doc(db, 'users', user.uid, 'sessions', sessionId);
          unsubscribeSession = onSnapshot(sessionRef, (doc) => {
            if (!doc.exists()) {
              signOut(auth);
              localStorage.removeItem('sessionId');
            }
          });
        }
      } else {
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
