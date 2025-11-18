-- ============================================
-- Add planner_tasks column to program_days
-- Para sincronizar tarefas do daily_planner com o programa
-- ============================================

ALTER TABLE public.program_days 
ADD COLUMN IF NOT EXISTS planner_tasks JSONB DEFAULT '[]'::jsonb;

-- Index para melhor performance em queries
CREATE INDEX IF NOT EXISTS idx_program_days_planner_tasks 
ON public.program_days USING GIN (planner_tasks);

