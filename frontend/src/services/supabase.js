/**
 * Zayqen AI — Supabase Client
 * Handles all authentication via Supabase Auth (HTTPS, no direct DB needed).
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '⚠️  Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in frontend/.env'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
