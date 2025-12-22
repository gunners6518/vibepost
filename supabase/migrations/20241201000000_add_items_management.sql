-- Add status, score, and last_seen_at columns to items table
-- This migration is safe to run on existing data

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
