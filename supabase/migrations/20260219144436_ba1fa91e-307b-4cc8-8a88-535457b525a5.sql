
-- Fix behavior_patterns: restrict to session owner
DROP POLICY IF EXISTS "Anyone can view behavior patterns" ON public.behavior_patterns;
DROP POLICY IF EXISTS "Anyone can insert behavior patterns" ON public.behavior_patterns;
DROP POLICY IF EXISTS "Anyone can update behavior patterns" ON public.behavior_patterns;

CREATE POLICY "Users view own behavior patterns" ON public.behavior_patterns
  FOR SELECT USING (owns_session(session_id));

CREATE POLICY "Users insert own behavior patterns" ON public.behavior_patterns
  FOR INSERT WITH CHECK (owns_session(session_id));

CREATE POLICY "Users update own behavior patterns" ON public.behavior_patterns
  FOR UPDATE USING (owns_session(session_id));

-- Fix task_workflows: restrict to session owner
DROP POLICY IF EXISTS "Anyone can view task workflows" ON public.task_workflows;
DROP POLICY IF EXISTS "Anyone can insert task workflows" ON public.task_workflows;
DROP POLICY IF EXISTS "Anyone can update task workflows" ON public.task_workflows;

CREATE POLICY "Users view own task workflows" ON public.task_workflows
  FOR SELECT USING (owns_session(session_id));

CREATE POLICY "Users insert own task workflows" ON public.task_workflows
  FOR INSERT WITH CHECK (owns_session(session_id));

CREATE POLICY "Users update own task workflows" ON public.task_workflows
  FOR UPDATE USING (owns_session(session_id));

-- Fix error_recovery_logs: restrict to session owner
DROP POLICY IF EXISTS "Anyone can view error recovery logs" ON public.error_recovery_logs;
DROP POLICY IF EXISTS "Anyone can insert error recovery logs" ON public.error_recovery_logs;

CREATE POLICY "Users view own error recovery logs" ON public.error_recovery_logs
  FOR SELECT USING (owns_session(session_id));

CREATE POLICY "Users insert own error recovery logs" ON public.error_recovery_logs
  FOR INSERT WITH CHECK (owns_session(session_id));

-- Fix confidence_logs: restrict to session owner
DROP POLICY IF EXISTS "Anyone can view confidence logs" ON public.confidence_logs;
DROP POLICY IF EXISTS "Anyone can insert confidence logs" ON public.confidence_logs;

CREATE POLICY "Users view own confidence logs" ON public.confidence_logs
  FOR SELECT USING (owns_session(session_id));

CREATE POLICY "Users insert own confidence logs" ON public.confidence_logs
  FOR INSERT WITH CHECK (owns_session(session_id));
