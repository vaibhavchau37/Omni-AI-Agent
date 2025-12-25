-- Add DELETE policy for user_sessions so users can delete their own sessions
CREATE POLICY "Users can delete own sessions" 
ON public.user_sessions 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);