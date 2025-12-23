-- Final fix for drafts table - Run in this exact order
-- IMPORTANT: Run Step 1 FIRST (enum values) before anything else

-- ============================================
-- STEP 1: Add enum values (RUN THIS FIRST, SEPARATELY, ONE AT A TIME)
-- ============================================
-- In Supabase SQL Editor, run these two commands separately:

-- Command 1:
-- ALTER TYPE draft_type ADD VALUE 'hook';

-- Command 2 (after Command 1 succeeds):
-- ALTER TYPE draft_type ADD VALUE 'checklist';

-- ============================================
-- STEP 2: Drop constraints FIRST (before updating data)
-- ============================================
-- Run this after Step 1 is complete:

-- Drop all existing CHECK constraints on the type column
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

-- Drop the specific constraint name if it exists
ALTER TABLE public.drafts DROP CONSTRAINT IF EXISTS drafts_type_check;

-- ============================================
-- STEP 3: Update existing data (after constraints are dropped)
-- ============================================
-- Update type column (text)
UPDATE public.drafts 
SET type = 'short' 
WHERE type = 'quote';

UPDATE public.drafts 
SET type = 'hook' 
WHERE type = 'thread_hook';

-- Update draft_type column (enum) - this should work now that enum has 'hook' value
UPDATE public.drafts 
SET draft_type = 'short'::draft_type
WHERE draft_type::text = 'quote';

UPDATE public.drafts 
SET draft_type = 'hook'::draft_type
WHERE draft_type::text = 'thread_hook';

-- ============================================
-- STEP 4: Add the new constraint (after data is updated)
-- ============================================
ALTER TABLE public.drafts 
ADD CONSTRAINT drafts_type_check 
CHECK (type IN ('short', 'hook', 'checklist'));

