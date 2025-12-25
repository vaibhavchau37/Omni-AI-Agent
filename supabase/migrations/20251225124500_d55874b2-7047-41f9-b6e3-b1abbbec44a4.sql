-- Fix agent_analytics: Remove overly permissive INSERT policy and restrict to service role
DROP POLICY IF EXISTS "System insert analytics" ON public.agent_analytics;

-- Create restrictive INSERT policy - only allow from service role (edge functions)
CREATE POLICY "Service role insert analytics" 
ON public.agent_analytics 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Fix agent_goals: The OR condition makes it too permissive
DROP POLICY IF EXISTS "Users insert own goals" ON public.agent_goals;

-- Create proper INSERT policy for agent_goals - must own session
CREATE POLICY "Users insert own goals" 
ON public.agent_goals 
FOR INSERT 
TO authenticated
WITH CHECK (owns_session(session_id));

-- Prevent users from modifying/deleting analytics (they shouldn't touch system metrics)
-- These don't exist yet, but let's ensure they're blocked
CREATE POLICY "No analytics updates" 
ON public.agent_analytics 
FOR UPDATE 
TO authenticated
USING (false);

CREATE POLICY "No analytics deletes" 
ON public.agent_analytics 
FOR DELETE 
TO authenticated
USING (false);