-- Fix drafts table type check constraint
-- This migration ensures the type column accepts 'short', 'hook', and 'checklist' values

-- First, update existing data to map old values to new values
-- Map 'quote' -> 'short' and 'thread_hook' -> 'hook'
UPDATE public.drafts 
SET type = 'short' 
WHERE type = 'quote';

UPDATE public.drafts 
SET type = 'hook' 
WHERE type = 'thread_hook';

-- Also update draft_type column (enum type) if it exists
-- First check if draft_type column exists, then update it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'drafts' 
        AND column_name = 'draft_type'
    ) THEN
        -- Update draft_type enum values
        -- Note: We need to cast to text first, then back to enum
        UPDATE public.drafts 
        SET draft_type = 'short'::draft_type
        WHERE draft_type::text = 'quote';
        
        UPDATE public.drafts 
        SET draft_type = 'hook'::draft_type
        WHERE draft_type::text = 'thread_hook';
    END IF;
END $$;

-- Drop all existing CHECK constraints on the type column
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Find all check constraints on the drafts.type column
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

-- Also drop the specific constraint name if it exists
ALTER TABLE public.drafts DROP CONSTRAINT IF EXISTS drafts_type_check;

-- Add the new constraint with correct values
ALTER TABLE public.drafts 
ADD CONSTRAINT drafts_type_check 
CHECK (type IN ('short', 'hook', 'checklist'));

