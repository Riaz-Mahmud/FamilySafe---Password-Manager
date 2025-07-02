
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, onSnapshot } from 'firebase/firestore';
import { updateSessionLastSeen } from '@/services/firestore';

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSession: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);

      if (unsubscribeSession) {
        unsubscribeSession();
      }

      if (user) {
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
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
