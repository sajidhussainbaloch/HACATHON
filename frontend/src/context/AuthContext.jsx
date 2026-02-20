import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle OAuth callback in URL (from Supabase redirect)
    supabase.auth.onAuthStateChange(async (_event, s) => {
      // This handles OAuth redirect automatically
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });
  }, []);

  const login = useCallback((s) => {
    // Called after manual signIn — session is set via onAuthStateChange too
    if (s?.user) {
      setSession(s);
      setUser(s.user);
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  }, []);

  const isAuthenticated = !!user && !!session;

  // Expose a friendly user shape for existing components
  const userProfile = user
    ? {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        is_verified: !!user.email_confirmed_at,
        avatar_url: user.user_metadata?.avatar_url || null,
        provider: user.app_metadata?.provider || 'email',
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user: userProfile,
        session,
        token: session?.access_token || null,
        loading,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
