-- Create conversation memory table
CREATE TABLE public.conversation_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('user_name', 'preference', 'context', 'request')),
  memory_key TEXT NOT NULL,
  memory_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_conversation_memory_session ON public.conversation_memory(session_id);
CREATE INDEX idx_conversation_memory_type ON public.conversation_memory(memory_type);

-- Enable RLS (public access for now since no auth)
ALTER TABLE public.conversation_memory ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for demo (no auth yet)
CREATE POLICY "Allow public access to conversation memory"
ON public.conversation_memory
FOR ALL
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for auto-updating timestamps
CREATE TRIGGER update_conversation_memory_updated_at
  BEFORE UPDATE ON public.conversation_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();