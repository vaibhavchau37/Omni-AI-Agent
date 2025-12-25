-- Fix conversation_summaries: Add UPDATE and DELETE policies to prevent tampering
CREATE POLICY "No summaries updates" 
ON public.conversation_summaries 
FOR UPDATE 
TO authenticated
USING (false);

CREATE POLICY "No summaries deletes" 
ON public.conversation_summaries 
FOR DELETE 
TO authenticated
USING (false);