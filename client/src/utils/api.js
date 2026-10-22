/**
 * GameDash API Client & Global Auth Interceptor
 * 
 * Automatically attaches JWT authentication headers to outgoing /api requests
 * and maintains reactive user session state.
 */

const TOKEN_KEY = 'gamedash_token';
const USER_KEY = 'gamedash_user';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch {}
}

export function clearAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
}

// Global fetch interceptor to automatically inject Authorization token
if (typeof window !== 'undefined' && window.fetch && !window.__gamedash_fetch_intercepted) {
  const originalFetch = window.fetch;
  window.fetch = async (input, init = {}) => {
    let url = typeof input === 'string' ? input : (input?.url || '');

    // Check if this is an internal API call that requires auth
    if (
      url.startsWith('/api/') &&
      !url.startsWith('/api/auth/login') &&
      !url.startsWith('/api/auth/register') &&
      !url.startsWith('/api/health')
    ) {
      const token = getToken();
      if (token) {
        init = init || {};
        const headers = new Headers(init.headers || {});
        if (!headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        init.headers = headers;
      }
    }

    const response = await originalFetch(input, init);

    // If an authenticated endpoint returns 401, trigger logout
    if (
      response.status === 401 &&
      url.startsWith('/api/') &&
      !url.startsWith('/api/auth/login') &&
      !url.startsWith('/api/auth/register')
    ) {
      clearAuth();
      window.dispatchEvent(new CustomEvent('gamedash:unauthorized'));
    }

    return response;
  };
  window.__gamedash_fetch_intercepted = true;
}

/**
 * Perform login against the backend API
 */
export async function loginUser(username, password) {
  const res = await window.fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Login failed. Please check your credentials.');
  }

  setToken(data.token);
  setCurrentUser(data.user);
  return data;
}

/**
 * Fetch profile of current user to verify session validity
 */
export async function verifySession() {
  const token = getToken();
  if (!token) return null;

  try {
    const res = await window.fetch('/api/auth/me');
    if (!res.ok) {
      clearAuth();
      return null;
    }
    const data = await res.json();
    if (data.success && data.user) {
      setCurrentUser(data.user);
      return data.user;
    }
    return null;
  } catch {
    return null;
  }
}
