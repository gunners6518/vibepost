-- Update draft_type enum to support new values
-- This migration updates the draft_type enum type to include 'hook' and 'checklist'
-- Note: ALTER TYPE ... ADD VALUE cannot be run inside a transaction block in some PostgreSQL versions

-- Add 'hook' to draft_type enum if it doesn't exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'draft_type') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'hook' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'draft_type')
    ) THEN
      ALTER TYPE draft_type ADD VALUE 'hook';
    END IF;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    -- Value already exists, ignore
    NULL;
END $$;

-- Add 'checklist' to draft_type enum if it doesn't exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'draft_type') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'checklist' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'draft_type')
    ) THEN
      ALTER TYPE draft_type ADD VALUE 'checklist';
    END IF;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    -- Value already exists, ignore
    NULL;
END $$;

