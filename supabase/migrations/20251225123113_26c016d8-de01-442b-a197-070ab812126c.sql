-- Create user_sessions table to link sessions to authenticated users
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON public.user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create security definer function to check session ownership
CREATE OR REPLACE FUNCTION public.owns_session(p_session_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_sessions
    WHERE session_id = p_session_id
    AND user_id = auth.uid()
  )
$$;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow public access to conversation memory" ON public.conversation_memory;
DROP POLICY IF EXISTS "Allow all operations on analytics" ON public.agent_analytics;
DROP POLICY IF EXISTS "Allow all operations on goals" ON public.agent_goals;
DROP POLICY IF EXISTS "Allow all operations on summaries" ON public.conversation_summaries;

-- conversation_memory: Users can only access their own session's data
CREATE POLICY "Users manage own memories" ON public.conversation_memory
  FOR SELECT USING (public.owns_session(session_id));

CREATE POLICY "Users insert own memories" ON public.conversation_memory
  FOR INSERT WITH CHECK (public.owns_session(session_id));

CREATE POLICY "Users update own memories" ON public.conversation_memory
  FOR UPDATE USING (public.owns_session(session_id));

CREATE POLICY "Users delete own memories" ON public.conversation_memory
  FOR DELETE USING (public.owns_session(session_id));

-- agent_analytics: Only authenticated users can read their own analytics
CREATE POLICY "Users read own analytics" ON public.agent_analytics
  FOR SELECT USING (public.owns_session(session_id));

CREATE POLICY "System insert analytics" ON public.agent_analytics
  FOR INSERT WITH CHECK (true);

-- agent_goals: Users manage their own goals
CREATE POLICY "Users read own goals" ON public.agent_goals
  FOR SELECT USING (public.owns_session(session_id));

CREATE POLICY "Users insert own goals" ON public.agent_goals
  FOR INSERT WITH CHECK (public.owns_session(session_id) OR session_id IS NOT NULL);

CREATE POLICY "Users update own goals" ON public.agent_goals
  FOR UPDATE USING (public.owns_session(session_id));

CREATE POLICY "Users delete own goals" ON public.agent_goals
  FOR DELETE USING (public.owns_session(session_id));

-- conversation_summaries: Users read their own summaries
CREATE POLICY "Users read own summaries" ON public.conversation_summaries
  FOR SELECT USING (public.owns_session(session_id));

CREATE POLICY "System insert summaries" ON public.conversation_summaries
  FOR INSERT WITH CHECK (true);

-- Add trigger for updated_at on user_sessions
CREATE TRIGGER update_user_sessions_updated_at
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();