'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('tutbus_access_token');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('tutbus_refresh_token');
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('tutbus_access_token', accessToken);
  localStorage.setItem('tutbus_refresh_token', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('tutbus_access_token');
  localStorage.removeItem('tutbus_refresh_token');
  localStorage.removeItem('tutbus_user');
}

export function getStoredUser<T = any>(): T | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('tutbus_user');
  return raw ? JSON.parse(raw) : null;
}

export function setStoredUser(user: unknown) {
  localStorage.setItem('tutbus_user', JSON.stringify(user));
}

// The admin's access token expires after 15 minutes (JWT_EXPIRES_IN). Rather
// than surface a raw "Unauthorized" the moment it lapses mid-task, silently
// exchange the 7-day refresh token for a new pair and retry the request once.
// Concurrent 401s share one in-flight refresh so we don't hammer the endpoint.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return null;
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return null;
        const body = await res.json();
        setTokens(body.accessToken, body.refreshToken);
        if (body.user) setStoredUser(body.user);
        return body.accessToken as string;
      } catch {
        return null;
      }
    })();
  }
  const token = await refreshPromise;
  refreshPromise = null;
  return token;
}

function redirectToLogin() {
  clearTokens();
  if (typeof window !== 'undefined') window.location.href = '/login';
}

async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401 && !isRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) return request<T>(path, options, true);
    redirectToLogin();
    throw new ApiError('Your session expired. Please sign in again.', 401);
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch {
      // ignore
    }
    throw new ApiError(Array.isArray(message) ? message.join(', ') : message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export { API_URL };
