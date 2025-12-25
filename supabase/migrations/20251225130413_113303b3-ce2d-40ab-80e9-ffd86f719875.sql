-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "Service role insert analytics" ON public.agent_analytics;

-- Create a new restrictive policy that only allows inserts from service role
-- This is done by checking if the request comes from the service role context
CREATE POLICY "Service role only insert analytics"
ON public.agent_analytics
FOR INSERT
TO service_role
WITH CHECK (true);

-- Also allow authenticated users to insert their own analytics if they own the session
CREATE POLICY "Users insert own analytics"
ON public.agent_analytics
FOR INSERT
TO authenticated
WITH CHECK (owns_session(session_id));