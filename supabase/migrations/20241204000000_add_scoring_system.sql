-- Add scoring system support
-- This migration adds tags, preference_version to items table and creates item_actions table

-- Add tags column to items table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'items' 
    AND column_name = 'tags'
  ) THEN
    ALTER TABLE public.items 
    ADD COLUMN tags text[];
  END IF;
END $$;

-- Add preference_version column to items table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'items' 
    AND column_name = 'preference_version'
  ) THEN
    ALTER TABLE public.items 
    ADD COLUMN preference_version integer NOT NULL DEFAULT 1;
  END IF;
END $$;

-- Create item_actions table to track user actions for preference learning
CREATE TABLE IF NOT EXISTS public.item_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('drafted', 'read_later', 'skipped', 'used')),
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for item_actions
CREATE INDEX IF NOT EXISTS idx_item_actions_item_id ON public.item_actions(item_id);
CREATE INDEX IF NOT EXISTS idx_item_actions_action ON public.item_actions(action);
CREATE INDEX IF NOT EXISTS idx_item_actions_created_at ON public.item_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_score ON public.items(score DESC);
CREATE INDEX IF NOT EXISTS idx_items_tags ON public.items USING GIN(tags);

