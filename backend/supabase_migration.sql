-- ============================================================================
-- RealityCheck AI — Supabase PostgreSQL Migration
-- ============================================================================
-- Run this SQL in your Supabase Dashboard → SQL Editor → New Query
-- This creates all tables needed for the application.
-- ============================================================================

-- ── Users Table ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    full_name   VARCHAR(255) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255),            -- nullable for Google OAuth users
    auth_provider   VARCHAR(50) DEFAULT 'email',  -- 'email' or 'google'
    is_verified BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- Index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);


-- ── OTPs Table ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otps (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL,
    code        VARCHAR(6) NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW(),
    used        BOOLEAN DEFAULT FALSE
);

-- Index for OTP lookups by email
CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email);


-- ── Password Resets Table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_resets (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL,
    token       VARCHAR(255) UNIQUE NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    used        BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Index for reset token lookups
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);


-- ── Auto-update updated_at trigger ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ── Cleanup: auto-delete expired OTPs and reset tokens (optional) ────────────
-- You can schedule this as a Supabase cron job via pg_cron extension.
-- DELETE FROM otps WHERE expires_at < NOW();
-- DELETE FROM password_resets WHERE expires_at < NOW();


-- ── Row Level Security (RLS) — recommended for production ───────────────────
-- Enable RLS on tables (Supabase best practice)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

-- Allow the service_role (backend) full access
-- These policies let your backend (using service_role key via DATABASE_URL) work.
-- The anon role is blocked by default when RLS is enabled.
CREATE POLICY "Service role full access on users"
    ON users FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access on otps"
    ON otps FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access on password_resets"
    ON password_resets FOR ALL
    USING (true)
    WITH CHECK (true);
