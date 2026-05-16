import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
} from 'firebase/auth';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (!firebaseUser.emailVerified) {
          setUser(null);
          setLoading(false);
          return;
        }

        try {
          const token = await firebaseUser.getIdToken();

          const res = await axios.post('/api/auth/sync', {}, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const userData = {
            ...res.data.data,
            firebaseToken: token,
          };

          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error('Auth sync failed:', error);
          setUser(null);
          localStorage.removeItem('user');
        }
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);

    if (!result.user.emailVerified) {
      // Automatically send verification email using Google's servers
      await sendEmailVerification(result.user);
      await signOut(auth);
      throw new Error('Please verify your email before logging in. A new verification link has been sent to your inbox.');
    }

    const token = await result.user.getIdToken();
    const res = await axios.post('/api/auth/sync', {}, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const userData = {
      ...res.data.data,
      firebaseToken: token,
    };

    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    localStorage.removeItem('user');
  };

  const getToken = async () => {
    const fbUser = auth.currentUser;
    if (fbUser) {
      return await fbUser.getIdToken(true);
    }
    const stored = JSON.parse(localStorage.getItem('user'));
    return stored?.firebaseToken;
  };

  const value = {
    user,
    setUser,
    loading,
    login,
    logout,
    getToken,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
