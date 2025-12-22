-- Update drafts table type check constraint
-- Change from ('short', 'quote', 'thread_hook') to ('short', 'hook', 'checklist')

-- Drop existing constraint
ALTER TABLE public.drafts DROP CONSTRAINT IF EXISTS drafts_type_check;

-- Add new constraint
ALTER TABLE public.drafts ADD CONSTRAINT drafts_type_check CHECK (type IN ('short', 'hook', 'checklist'));
