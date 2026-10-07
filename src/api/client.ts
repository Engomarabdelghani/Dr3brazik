import { getAccessToken, notifySessionExpired, setAccessToken } from './tokenStore';
import type { AuthSession } from './types';

/** e.g. https://api.dr3brazik.com/api: set VITE_API_BASE_URL; defaults to same-origin /api. */
export const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api').replace(/\/+$/, '');

const TIMEOUT_MS = 15_000;

export interface FieldError {
  path: string;
  code: string;
  message: string;
}

export interface PageMeta {
  total: number;
  page: number;
  pageSize: number;
}

/** Every failed call throws this; `message` is safe to show to the user. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly errors: FieldError[];

  constructor(status: number, code: string, message: string, errors: FieldError[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

export const isApiError = (err: unknown, code?: string): err is ApiError =>
  err instanceof ApiError && (code === undefined || err.code === code);

type Query = Record<string, string | number | boolean | null | undefined>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Query;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Query): string {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

// ---------------------------------------------------------------- refresh (single flight)

let refreshing: Promise<AuthSession | null> | null = null;

/** Exchanges the httpOnly refresh cookie for a new access token. Concurrent callers share one request. */
export function refreshSession(): Promise<AuthSession | null> {
  refreshing ??= (async () => {
    try {
      const res = await fetch(buildUrl('/auth/refresh'), { method: 'POST', credentials: 'include' });
      if (!res.ok) {
        setAccessToken(null);
        return null;
      }
      const body = (await res.json()) as { data: AuthSession };
      setAccessToken(body.data.accessToken);
      return body.data;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

// ---------------------------------------------------------------- request

async function send(path: string, options: RequestOptions): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  options.signal?.addEventListener('abort', () => controller.abort(), { once: true });

  const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    return await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body,
      credentials: 'include',
      signal: controller.signal,
    });
  } catch (err) {
    if (options.signal?.aborted) throw err;
    throw new ApiError(0, 'NETWORK', 'Could not reach the server. Check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }
}

/** Full envelope: `{ data, meta }`. Retries once after refreshing an expired admin token. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<{ data: T; meta?: PageMeta }> {
  let res = await send(path, options);

  if (res.status === 401 && getAccessToken() && !path.startsWith('/auth/')) {
    const session = await refreshSession();
    if (session) res = await send(path, options);
    else notifySessionExpired();
  }

  if (res.status === 204) return { data: undefined as T };

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(
      res.status,
      payload?.code ?? 'HTTP_ERROR',
      payload?.message ?? 'Something went wrong. Please try again.',
      payload?.errors ?? []
    );
  }
  return { data: payload?.data as T, meta: payload?.meta };
}

export const api = {
  get: async <T>(path: string, query?: Query, signal?: AbortSignal) => (await apiRequest<T>(path, { query, signal })).data,
  post: async <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
    (await apiRequest<T>(path, { method: 'POST', body, headers })).data,
  put: async <T>(path: string, body?: unknown) => (await apiRequest<T>(path, { method: 'PUT', body })).data,
  patch: async <T>(path: string, body?: unknown) => (await apiRequest<T>(path, { method: 'PATCH', body })).data,
  delete: async <T>(path: string, body?: unknown) => (await apiRequest<T>(path, { method: 'DELETE', body })).data,
};

/** For GETs that are allowed to be missing: 404 → null. */
export async function getOrNull<T>(path: string): Promise<T | null> {
  try {
    return await api.get<T>(path);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
