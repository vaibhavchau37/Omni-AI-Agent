-- Analytics table for tracking AI interactions
CREATE TABLE public.agent_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  intent TEXT,
  task_success BOOLEAN DEFAULT true,
  confidence TEXT,
  emotion TEXT,
  retry_count INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  agent_role TEXT DEFAULT 'default',
  is_simulation BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Goals tracking table for goal-oriented mode
CREATE TABLE public.agent_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  goal_description TEXT NOT NULL,
  total_steps INTEGER DEFAULT 0,
  completed_steps INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Context summaries for long conversation handling
CREATE TABLE public.conversation_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.agent_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_summaries ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (session-based, no auth required for demo)
CREATE POLICY "Allow all operations on analytics" ON public.agent_analytics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on goals" ON public.agent_goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on summaries" ON public.conversation_summaries FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_analytics_session ON public.agent_analytics(session_id);
CREATE INDEX idx_analytics_created ON public.agent_analytics(created_at DESC);
CREATE INDEX idx_goals_session ON public.agent_goals(session_id);
CREATE INDEX idx_summaries_session ON public.conversation_summaries(session_id);