'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { usersApi, adminApi, type User } from './api';

interface AdminSession {
  username: string;
  adminKey: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string, key: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
  adminSession: AdminSession | null;
  adminKey: string | null;
  adminUsername: string | null;
  setAdminSession: (session: AdminSession | null) => void;
  adminLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminSession, setAdminSessionState] = useState<AdminSession | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('antromic_token');
    const storedAdminSession = localStorage.getItem('antromic_admin_session');
    
    if (storedAdminSession) {
      try {
        const session = JSON.parse(storedAdminSession);
        // Verify the admin session is still valid with the API
        adminApi.verify(session.username, session.adminKey).then((res) => {
          if (res.success) {
            setAdminSessionState(session);
          } else {
            localStorage.removeItem('antromic_admin_session');
          }
        }).catch(() => {
          localStorage.removeItem('antromic_admin_session');
        });
      } catch {
        localStorage.removeItem('antromic_admin_session');
      }
    }

    if (storedToken) {
      usersApi.verify(storedToken).then((res) => {
        if (res.success) {
          setUser(res.user);
          setToken(storedToken);
        } else {
          localStorage.removeItem('antromic_token');
        }
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await usersApi.login(username, password);
      if (res.success) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('antromic_token', res.token);
        return { success: true };
      }
      return { success: false, error: res.error };
    } catch {
      return { success: false, error: 'Failed to connect to server' };
    }
  }, []);

  const register = useCallback(async (username: string, password: string, key: string) => {
    try {
      const res = await usersApi.register(username, password, key);
      if (res.success) {
        return login(username, password);
      }
      return { success: false, error: res.error };
    } catch {
      return { success: false, error: 'Failed to connect to server' };
    }
  }, [login]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('antromic_token');
  }, []);

  const adminLogin = useCallback(async (username: string, password: string) => {
    // ALWAYS use the Cloudflare API for admin login - this creates and stores the admin key
    try {
      const res = await adminApi.login(username, password);
      if (res.success && res.adminKey) {
        const session: AdminSession = {
          username: res.username,
          adminKey: res.adminKey,
          role: res.role
        };
        setAdminSessionState(session);
        localStorage.setItem('antromic_admin_session', JSON.stringify(session));
        return { success: true };
      }
      return { success: false, error: res.error || 'Invalid credentials' };
    } catch (err) {
      console.error('Admin login error:', err);
      return { success: false, error: 'Failed to connect to server' };
    }
  }, []);

  const adminLogout = useCallback(() => {
    setAdminSessionState(null);
    localStorage.removeItem('antromic_admin_session');
  }, []);

  const setAdminSession = useCallback((session: AdminSession | null) => {
    setAdminSessionState(session);
    if (session) {
      localStorage.setItem('antromic_admin_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('antromic_admin_session');
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isAdmin: !!adminSession,
        adminSession,
        adminKey: adminSession?.adminKey || null,
        adminUsername: adminSession?.username || null,
        setAdminSession,
        adminLogin,
        adminLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
