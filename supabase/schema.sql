-- ==========================================
-- Decider Wheel - Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Create the decisions table
CREATE TABLE IF NOT EXISTS public.decisions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  options JSONB NOT NULL,
  creator_token TEXT NOT NULL,
  spun BOOLEAN NOT NULL DEFAULT FALSE,
  spun_at TIMESTAMPTZ,
  winner_index INTEGER,
  winner_choice TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_decisions_created_at ON public.decisions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_spun ON public.decisions (spun);

-- 3. Row Level Security (RLS)
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read decision rows (public spin link)
-- Note: The application API server masks the options array before returning it to users who haven't spun yet.
CREATE POLICY "Public read decisions"
  ON public.decisions
  FOR SELECT
  USING (true);

-- Policy: Allow insert for creating new decisions
CREATE POLICY "Public insert decisions"
  ON public.decisions
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow updates for recording spin result
CREATE POLICY "Allow spin updates"
  ON public.decisions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 4. Enable Realtime (optional, allows creator to see instant live updates when friend spins)
ALTER PUBLICATION supabase_realtime ADD TABLE public.decisions;
