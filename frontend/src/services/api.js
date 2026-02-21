/**
 * Reality Check AI Plus — API service
 * Communicates with the FastAPI backend for analysis.
 * Auth is handled directly by Supabase (see supabase.js + AuthContext).
 */
import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_URL || '';

function getAuthHeaders() {
  // We'll get the token from supabase session synchronously if available
  const key = `sb-${import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      const token = parsed?.access_token || parsed?.currentSession?.access_token;
      if (token) return { Authorization: `Bearer ${token}` };
    }
  } catch { /* ignore */ }
  return {};
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

export async function uploadStudentNotes(file) {
  if (!file) throw new Error('Please select a file to upload.');
  const formData = new FormData();
  formData.append('file', file);

  const resp = await fetch(`${API_BASE}/student/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  return parseResponse(resp, 'Notes upload failed');
}

export async function askStudentQuestion(question) {
  const resp = await fetch(`${API_BASE}/student/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ question }),
  });

  return parseResponse(resp, 'Question answering failed');
}

export async function generateStudyTool(mode) {
  const resp = await fetch(`${API_BASE}/student/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ mode }),
  });

  return parseResponse(resp, 'Study tool generation failed');
}

// ── Supabase Auth helpers (used by pages) ────────────────────────────────────

export async function apiSignup({ full_name, email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
    },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function apiLogin({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  return data;
}

// Note: Google OAuth removed — keep email/password flows only.

export async function apiForgotPassword({ email }) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw new Error(error.message);
  return { message: 'Reset email sent.' };
}

export async function apiResetPassword({ new_password }) {
  const { error } = await supabase.auth.updateUser({
    password: new_password,
  });
  if (error) throw new Error(error.message);
  return { message: 'Password updated.' };
}

export async function apiUpdateProfile({ full_name }) {
  const updates = {};
  if (full_name) updates.full_name = full_name;
  if (arguments[0]?.avatar_url) updates.avatar_url = arguments[0].avatar_url;
  if (arguments[0]?.bio) updates.bio = arguments[0].bio;

  const { data, error } = await supabase.auth.updateUser({
    data: updates,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function uploadAvatar(file, userId) {
  if (!file) throw new Error('No file provided');
  const path = `avatars/${userId}/${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage.from('avatars').upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw new Error(error.message);
  const url = supabase.storage.from('avatars').getPublicUrl(path).publicUrl;
  return url;
}

export async function requestOtp(email) {
  const resp = await fetch(`${API_BASE}/auth/request-otp`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
  });
  return parseResponse(resp, 'Failed to request OTP');
}

export async function verifyOtp({ email, otp }) {
  const resp = await fetch(`${API_BASE}/auth/verify-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp }) });
  return parseResponse(resp, 'OTP verification failed');
}

// OTP verification is NOT needed — Supabase handles email verification automatically.
export async function apiVerifyOTP() {
  return { message: 'Supabase verifies emails via link automatically.' };
}

