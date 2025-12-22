-- Alter drafts table to add missing columns if they don't exist
-- This migration is safe to run on existing data

-- Add type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'drafts' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE public.drafts 
    ADD COLUMN type text CHECK (type IN ('short', 'quote', 'thread_hook'));
  END IF;
END $$;

-- Add text column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'drafts' 
    AND column_name = 'text'
  ) THEN
    ALTER TABLE public.drafts 
    ADD COLUMN text text;
  END IF;
END $$;

-- Add status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'drafts' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.drafts 
    ADD COLUMN status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'created', 'failed'));
  END IF;
END $$;

-- Add typefully_draft_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'drafts' 
    AND column_name = 'typefully_draft_id'
  ) THEN
    ALTER TABLE public.drafts 
    ADD COLUMN typefully_draft_id text;
  END IF;
END $$;

-- Add typefully_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'drafts' 
    AND column_name = 'typefully_url'
  ) THEN
    ALTER TABLE public.drafts 
    ADD COLUMN typefully_url text;
  END IF;
END $$;

-- Add created_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'drafts' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.drafts 
    ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'drafts' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.drafts 
    ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_drafts_item_id ON public.drafts(item_id);
CREATE INDEX IF NOT EXISTS idx_drafts_type ON public.drafts(type);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON public.drafts(status);

-- Add updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_drafts_updated_at ON public.drafts;
CREATE TRIGGER update_drafts_updated_at
  BEFORE UPDATE ON public.drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
