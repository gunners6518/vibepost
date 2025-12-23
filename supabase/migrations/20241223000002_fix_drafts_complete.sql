-- Complete fix for drafts table type and draft_type columns
-- This migration must be run in the correct order

-- Step 1: Add new enum values to draft_type enum (if it exists)
-- Note: This may need to be run separately in Supabase SQL Editor if it fails in a transaction
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'draft_type') THEN
    -- Add 'hook' if it doesn't exist
    BEGIN
      ALTER TYPE draft_type ADD VALUE IF NOT EXISTS 'hook';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN OTHERS THEN
        -- If ADD VALUE IF NOT EXISTS is not supported, try without it
        BEGIN
          ALTER TYPE draft_type ADD VALUE 'hook';
        EXCEPTION
          WHEN duplicate_object THEN NULL;
        END;
    END;
    
    -- Add 'checklist' if it doesn't exist
    BEGIN
      ALTER TYPE draft_type ADD VALUE IF NOT EXISTS 'checklist';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN OTHERS THEN
        BEGIN
          ALTER TYPE draft_type ADD VALUE 'checklist';
        EXCEPTION
          WHEN duplicate_object THEN NULL;
        END;
    END;
  END IF;
END $$;

-- Step 2: Update existing data in type column (text)
UPDATE public.drafts 
SET type = 'short' 
WHERE type = 'quote';

UPDATE public.drafts 
SET type = 'hook' 
WHERE type = 'thread_hook';

-- Step 3: Update existing data in draft_type column (enum) if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'drafts' 
        AND column_name = 'draft_type'
    ) THEN
        -- Update draft_type enum values
        UPDATE public.drafts 
        SET draft_type = 'short'::draft_type
        WHERE draft_type::text = 'quote';
        
        UPDATE public.drafts 
        SET draft_type = 'hook'::draft_type
        WHERE draft_type::text = 'thread_hook';
    END IF;
END $$;

-- Step 4: Drop all existing CHECK constraints on the type column
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.drafts'::regclass
        AND contype = 'c'
        AND conname LIKE '%type%'
    LOOP
        EXECUTE 'ALTER TABLE public.drafts DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- Step 5: Drop the specific constraint name if it exists
ALTER TABLE public.drafts DROP CONSTRAINT IF EXISTS drafts_type_check;

-- Step 6: Add the new constraint with correct values
ALTER TABLE public.drafts 
ADD CONSTRAINT drafts_type_check 
CHECK (type IN ('short', 'hook', 'checklist'));

