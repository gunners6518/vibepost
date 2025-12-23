-- Step-by-step fix for drafts table
-- IMPORTANT: Run Step 1 separately in Supabase SQL Editor (outside transaction)
-- Then run Steps 2-5 together

-- ============================================
-- STEP 1: Add enum values (RUN THIS FIRST, SEPARATELY)
-- ============================================
-- Copy and run these two commands ONE AT A TIME in Supabase SQL Editor:

-- Command 1:
-- ALTER TYPE draft_type ADD VALUE 'hook';

-- Command 2:
-- ALTER TYPE draft_type ADD VALUE 'checklist';

-- ============================================
-- STEP 2-5: Run these together after Step 1
-- ============================================

-- Step 2: Update existing data in type column (text)
UPDATE public.drafts 
SET type = 'short' 
WHERE type = 'quote';

UPDATE public.drafts 
SET type = 'hook' 
WHERE type = 'thread_hook';

-- Step 3: Update existing data in draft_type column (enum)
-- First, let's check if we can update it
UPDATE public.drafts 
SET draft_type = 'short'::draft_type
WHERE draft_type::text = 'quote';

UPDATE public.drafts 
SET draft_type = 'hook'::draft_type
WHERE draft_type::text = 'thread_hook';

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

