-- Run all migrations to fix missing columns
-- Execute this file in Supabase Dashboard SQL Editor

-- ============================================
-- Migration 1: Add status, score, and last_seen_at columns
-- ============================================

-- Add status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'items' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.items 
    ADD COLUMN status text NOT NULL DEFAULT 'new';
  END IF;
END $$;

-- Add score column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'items' 
    AND column_name = 'score'
  ) THEN
    ALTER TABLE public.items 
    ADD COLUMN score integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add last_seen_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'items' 
    AND column_name = 'last_seen_at'
  ) THEN
    ALTER TABLE public.items 
    ADD COLUMN last_seen_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- Create index on status column if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_items_status ON public.items(status);

-- ============================================
-- Migration 2: Ensure published_at column exists
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'items' 
    AND column_name = 'published_at'
  ) THEN
    ALTER TABLE public.items 
    ADD COLUMN published_at timestamptz;
  END IF;
END $$;

-- Create index on published_at column if it doesn't exist for better query performance
CREATE INDEX IF NOT EXISTS idx_items_published_at ON public.items(published_at);

-- ============================================
-- Verification: Check that all columns exist
-- ============================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'items'
  AND column_name IN ('status', 'score', 'last_seen_at', 'published_at')
ORDER BY column_name;
