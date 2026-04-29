import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { getSupabase, isSupabaseConfigured } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const refreshUser = async () => {
    if (!isSupabaseConfigured) {
      setUser(null);
      setAuthError({
        type: 'config_missing',
        message: 'Supabase is not configured.',
      });
      setIsLoadingAuth(false);
      setAuthChecked(true);
      return null;
    }

    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setAuthChecked(true);
      return currentUser;
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setAuthError({
        type: 'auth_error',
        message: error.message || 'Failed to authenticate user.',
      });
      setAuthChecked(true);
      return null;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      setUser(null);
      setAuthError({
        type: 'config_missing',
        message: 'Supabase is not configured.',
      });
      setIsLoadingAuth(false);
      setAuthChecked(true);
      return undefined;
    }

    refreshUser();

    const supabase = getSupabase();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      if (mounted) {
        refreshUser();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      appPublicSettings: null,
      authChecked,
      logout: base44.auth.logout,
      navigateToLogin: () => {},
      checkUserAuth: refreshUser,
      checkAppState: refreshUser,
      refreshUser,
    }),
    [user, isLoadingAuth, authError, authChecked]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
