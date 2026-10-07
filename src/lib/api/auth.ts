import { api, refreshSession } from '../../api/client';
import { setAccessToken } from '../../api/tokenStore';
import type { AuthAdmin, AuthSession } from '../../api/types';

export async function login(email: string, password: string): Promise<AuthSession> {
  const session = await api.post<AuthSession>('/auth/login', { email: email.trim(), password });
  setAccessToken(session.accessToken);
  return session;
}

/** Restores the session after a page reload from the httpOnly refresh cookie. */
export async function restoreSession(): Promise<AuthAdmin | null> {
  const session = await refreshSession();
  return session?.admin ?? null;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    setAccessToken(null);
  }
}
