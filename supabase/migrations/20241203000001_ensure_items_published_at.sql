-- Ensure published_at column exists in items table
-- This migration is safe to run on existing data

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
