import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthAdmin } from '../api/types';
import { onSessionExpired } from '../api/tokenStore';
import { login, logout, restoreSession } from '../lib/api/auth';

interface AdminAuthContextValue {
  /** The signed-in admin, or null. */
  admin: AuthAdmin | null;
  isAdmin: boolean;
  isOwner: boolean;
  loading: boolean;
  /** Restores the session from the refresh cookie once; admin pages call it (storefront visitors never do). */
  ensureSession: () => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

/**
 * Admin session backed by the Node API: a short-lived access token kept in memory
 * plus an httpOnly refresh cookie. The first admin page shown restores the
 * session from the cookie, like Supabase's persisted session did.
 */
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AuthAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const restoreStarted = useRef(false);
  const queryClient = useQueryClient();

  const ensureSession = useCallback(() => {
    if (restoreStarted.current) return;
    restoreStarted.current = true;
    restoreSession()
      .then((restored) => setAdmin((current) => current ?? restored))
      .finally(() => setLoading(false));
  }, []);

  // The API client calls this when a refresh fails (expired, revoked, removed from the team).
  useEffect(
    () =>
      onSessionExpired(() => {
        setAdmin(null);
        queryClient.removeQueries({ queryKey: ['admin'] });
      }),
    [queryClient]
  );

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const session = await login(email, password);
      restoreStarted.current = true;
      setLoading(false);
      setAdmin(session.admin);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Could not sign in. Please try again.' };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logout();
    } finally {
      setAdmin(null);
      queryClient.removeQueries({ queryKey: ['admin'] });
    }
  }, [queryClient]);

  return (
    <AdminAuthContext.Provider value={{ admin, isAdmin: admin !== null, isOwner: admin?.role === 'owner', loading, ensureSession, signIn, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
