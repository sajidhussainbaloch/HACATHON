import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('rc_token'));
  const [loading, setLoading] = useState(true);

  // Fetch user profile on mount if token exists
  useEffect(() => {
    if (token) {
      fetchProfile(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (jwt) => {
    try {
      const resp = await fetch('/auth/profile', {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (resp.ok) {
        const text = await resp.text();
        const data = JSON.parse(text);
        setUser(data);
      } else {
        // Token invalid/expired — clear it
        localStorage.removeItem('rc_token');
        setToken(null);
        setUser(null);
      }
    } catch {
      localStorage.removeItem('rc_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback((jwt) => {
    localStorage.setItem('rc_token', jwt);
    setToken(jwt);
    fetchProfile(jwt);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('rc_token');
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
