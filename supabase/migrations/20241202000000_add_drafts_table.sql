-- Create drafts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('short', 'quote', 'thread_hook')),
  text text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'created', 'failed')),
  typefully_draft_id text,
  typefully_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_drafts_item_id ON public.drafts(item_id);
CREATE INDEX IF NOT EXISTS idx_drafts_type ON public.drafts(type);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON public.drafts(status);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_drafts_updated_at
  BEFORE UPDATE ON public.drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
