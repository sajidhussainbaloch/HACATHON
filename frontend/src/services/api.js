/**
 * RealityCheck AI — API service
 * Communicates with the FastAPI backend.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

function getAuthHeaders() {
  const token = localStorage.getItem('rc_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Safely parse JSON response, extracting a readable error message. */
async function parseResponse(resp, fallbackMsg) {
  let data;
  try {
    const text = await resp.text();
    data = JSON.parse(text);
  } catch {
    if (!resp.ok) throw new Error(fallbackMsg || `Server error (${resp.status})`);
    throw new Error('Invalid response from server');
  }

  if (!resp.ok) {
    let msg = fallbackMsg;
    if (data?.detail) {
      msg = typeof data.detail === 'string'
        ? data.detail
        : Array.isArray(data.detail)
          ? data.detail.map(e => e.msg || JSON.stringify(e)).join('; ')
          : JSON.stringify(data.detail);
    }
    throw new Error(msg);
  }
  return data;
}

/**
 * Send text or image to /analyze and return structured results.
 * Requires authentication (JWT token).
 */
export async function analyzeContent({ text, file }) {
  const formData = new FormData();
  if (file) formData.append('file', file);
  if (text) formData.append('text', text);

  const resp = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  return parseResponse(resp, 'Analysis failed');
}

/**
 * Health check
 */
export async function healthCheck() {
  const resp = await fetch(`${API_BASE}/health`);
  return resp.json();
}

// ── Authentication API ──────────────────────────────────────────────────────

export async function apiSignup({ full_name, email, password }) {
  const resp = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name, email, password }),
  });
  return parseResponse(resp, 'Signup failed');
}

export async function apiVerifyOTP({ email, otp }) {
  const resp = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  return parseResponse(resp, 'OTP verification failed');
}

export async function apiLogin({ email, password }) {
  const resp = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return parseResponse(resp, 'Login failed');
}

export async function apiForgotPassword({ email }) {
  const resp = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return parseResponse(resp, 'Request failed');
}

export async function apiResetPassword({ token, new_password }) {
  const resp = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password }),
  });
  return parseResponse(resp, 'Password reset failed');
}

export async function apiUpdateProfile({ full_name }) {
  const resp = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ full_name }),
  });
  return parseResponse(resp, 'Update failed');
}

/**
 * Authenticate with Google OAuth.
 * idToken is the JWT from Google Sign-In.
 */
export async function apiGoogleAuth({ idToken }) {
  const resp = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  });
  return parseResponse(resp, 'Google login failed');
}

