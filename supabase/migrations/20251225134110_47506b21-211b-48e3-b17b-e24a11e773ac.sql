-- Table for storing learned user behavior patterns
CREATE TABLE public.behavior_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  pattern_type TEXT NOT NULL, -- 'repeated_task', 'time_preference', 'tool_preference'
  pattern_key TEXT NOT NULL,
  pattern_value TEXT NOT NULL,
  occurrence_count INTEGER DEFAULT 1,
  last_occurred_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confidence_score NUMERIC(3,2) DEFAULT 0.5, -- 0.00 to 1.00
  is_automated BOOLEAN DEFAULT false,
  user_approved BOOLEAN DEFAULT false
);

-- Table for storing task workflows for replay
CREATE TABLE public.task_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  task_name TEXT NOT NULL,
  task_description TEXT,
  workflow_steps JSONB NOT NULL, -- Array of step objects
  input_params JSONB, -- Original input parameters
  output_result JSONB, -- Final result
  execution_time_ms INTEGER,
  status TEXT DEFAULT 'completed', -- 'completed', 'failed', 'partial'
  replay_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_replayed_at TIMESTAMP WITH TIME ZONE
);

-- Table for confidence score logging
CREATE TABLE public.confidence_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  confidence_score NUMERIC(3,2) NOT NULL,
  threshold_used NUMERIC(3,2) DEFAULT 0.70,
  action_taken TEXT NOT NULL, -- 'executed', 'asked_user', 'declined'
  reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for error recovery attempts
CREATE TABLE public.error_recovery_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  original_task TEXT NOT NULL,
  error_reason TEXT NOT NULL,
  alternative_strategy TEXT,
  retry_count INTEGER DEFAULT 0,
  final_status TEXT NOT NULL, -- 'recovered', 'failed', 'user_cancelled'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.behavior_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confidence_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_recovery_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_behavior_patterns_session ON public.behavior_patterns(session_id);
CREATE INDEX idx_behavior_patterns_type ON public.behavior_patterns(pattern_type);
CREATE INDEX idx_task_workflows_session ON public.task_workflows(session_id);
CREATE INDEX idx_task_workflows_name ON public.task_workflows(task_name);
CREATE INDEX idx_confidence_logs_session ON public.confidence_logs(session_id);
CREATE INDEX idx_error_recovery_session ON public.error_recovery_logs(session_id);

-- RLS Policies for behavior_patterns
CREATE POLICY "Anyone can view behavior patterns" ON public.behavior_patterns FOR SELECT USING (true);
CREATE POLICY "Anyone can insert behavior patterns" ON public.behavior_patterns FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update behavior patterns" ON public.behavior_patterns FOR UPDATE USING (true);

-- RLS Policies for task_workflows
CREATE POLICY "Anyone can view task workflows" ON public.task_workflows FOR SELECT USING (true);
CREATE POLICY "Anyone can insert task workflows" ON public.task_workflows FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update task workflows" ON public.task_workflows FOR UPDATE USING (true);

-- RLS Policies for confidence_logs
CREATE POLICY "Anyone can view confidence logs" ON public.confidence_logs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert confidence logs" ON public.confidence_logs FOR INSERT WITH CHECK (true);

-- RLS Policies for error_recovery_logs
CREATE POLICY "Anyone can view error recovery logs" ON public.error_recovery_logs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert error recovery logs" ON public.error_recovery_logs FOR INSERT WITH CHECK (true);