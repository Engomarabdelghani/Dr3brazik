/**
 * The admin access token lives in memory only: never localStorage, so a script
 * injected into the page can't read it back later. A page reload gets a fresh
 * one from the httpOnly refresh cookie (see AdminAuthContext).
 */
let accessToken: string | null = null;
const expiredListeners = new Set<() => void>();

export const getAccessToken = (): string | null => accessToken;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/** Called by the API client when the session can't be refreshed; the auth context signs out. */
export function onSessionExpired(listener: () => void): () => void {
  expiredListeners.add(listener);
  return () => expiredListeners.delete(listener);
}

export function notifySessionExpired(): void {
  accessToken = null;
  expiredListeners.forEach((listener) => listener());
}
