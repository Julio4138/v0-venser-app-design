-- ============================================
-- VENSER Program Structure - Jornada de 90 Dias
-- ============================================

-- ============================================
-- 1. PROGRAM_DAY_TEMPLATES TABLE
-- Templates dos dias do programa (gerenciados pelo admin)
-- ============================================
CREATE TABLE IF NOT EXISTS public.program_day_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  day_number INTEGER NOT NULL UNIQUE CHECK (day_number >= 1),
  title_pt TEXT NOT NULL,
  title_en TEXT,
  title_es TEXT,
  content_text_pt TEXT,
  content_text_en TEXT,
  content_text_es TEXT,
  content_audio_url TEXT,
  content_video_url TEXT,
  motivational_quote_pt TEXT,
  motivational_quote_en TEXT,
  motivational_quote_es TEXT,
  xp_reward INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 2. PROGRAM_DAY_TASKS TABLE
-- Tarefas/Checklist de cada dia
-- ============================================
CREATE TABLE IF NOT EXISTS public.program_day_tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  template_id UUID REFERENCES public.program_day_templates(id) ON DELETE CASCADE NOT NULL,
  task_order INTEGER NOT NULL,
  title_pt TEXT NOT NULL,
  title_en TEXT,
  title_es TEXT,
  description_pt TEXT,
  description_en TEXT,
  description_es TEXT,
  task_type TEXT DEFAULT 'checklist' CHECK (task_type IN ('checklist', 'reflection', 'meditation', 'reading')),
  xp_reward INTEGER DEFAULT 10,
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(template_id, task_order)
);

-- ============================================
-- 3. PROGRAM_DAY_USER_PROGRESS TABLE
-- Progresso do usuário em cada dia (checklist, reflexão, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS public.program_day_user_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL,
  task_id UUID REFERENCES public.program_day_tasks(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  reflection_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, day_number, task_id)
);

-- ============================================
-- 4. UPDATE PROGRAM_DAYS TABLE
-- Adicionar campos para reflexão e controle de desbloqueio
-- ============================================
ALTER TABLE public.program_days 
ADD COLUMN IF NOT EXISTS reflection_text TEXT,
ADD COLUMN IF NOT EXISTS tasks_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_tasks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.program_day_templates(id);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_program_day_templates_day_number ON public.program_day_templates(day_number);
CREATE INDEX IF NOT EXISTS idx_program_day_tasks_template_id ON public.program_day_tasks(template_id);
CREATE INDEX IF NOT EXISTS idx_program_day_user_progress_user_id ON public.program_day_user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_program_day_user_progress_day_number ON public.program_day_user_progress(day_number);
CREATE INDEX IF NOT EXISTS idx_program_days_template_id ON public.program_days(template_id);

-- ============================================
-- TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS update_program_day_templates_updated_at ON public.program_day_templates;
CREATE TRIGGER update_program_day_templates_updated_at BEFORE UPDATE ON public.program_day_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_program_day_user_progress_updated_at ON public.program_day_user_progress;
CREATE TRIGGER update_program_day_user_progress_updated_at BEFORE UPDATE ON public.program_day_user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.program_day_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_day_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_day_user_progress ENABLE ROW LEVEL SECURITY;

-- Policies para PROGRAM_DAY_TEMPLATES
-- Todos podem ver templates ativos
DROP POLICY IF EXISTS "Anyone can view active templates" ON public.program_day_templates;
CREATE POLICY "Anyone can view active templates"
  ON public.program_day_templates FOR SELECT
  USING (is_active = TRUE);

-- Admin pode gerenciar templates (será configurado depois com role check)
DROP POLICY IF EXISTS "Admins can manage templates" ON public.program_day_templates;
CREATE POLICY "Admins can manage templates"
  ON public.program_day_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_pro = TRUE
    )
  );

-- Policies para PROGRAM_DAY_TASKS
-- Todos podem ver tarefas de templates ativos
DROP POLICY IF EXISTS "Anyone can view tasks of active templates" ON public.program_day_tasks;
CREATE POLICY "Anyone can view tasks of active templates"
  ON public.program_day_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.program_day_templates
      WHERE id = template_id AND is_active = TRUE
    )
  );

-- Admin pode gerenciar tarefas
DROP POLICY IF EXISTS "Admins can manage tasks" ON public.program_day_tasks;
CREATE POLICY "Admins can manage tasks"
  ON public.program_day_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_pro = TRUE
    )
  );

-- Policies para PROGRAM_DAY_USER_PROGRESS
DROP POLICY IF EXISTS "Users can view their own progress" ON public.program_day_user_progress;
CREATE POLICY "Users can view their own progress"
  ON public.program_day_user_progress FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own progress" ON public.program_day_user_progress;
CREATE POLICY "Users can insert their own progress"
  ON public.program_day_user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own progress" ON public.program_day_user_progress;
CREATE POLICY "Users can update their own progress"
  ON public.program_day_user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTION: Verificar se dia pode ser desbloqueado
-- ============================================
CREATE OR REPLACE FUNCTION public.can_unlock_day(p_user_id UUID, p_day_number INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_previous_day_completed BOOLEAN;
  v_current_day INTEGER;
BEGIN
  -- Se for o dia 1, sempre pode desbloquear
  IF p_day_number = 1 THEN
    RETURN TRUE;
  END IF;

  -- Verificar se o dia anterior foi completado
  SELECT completed INTO v_previous_day_completed
  FROM public.program_days
  WHERE user_id = p_user_id AND day_number = p_day_number - 1;

  RETURN COALESCE(v_previous_day_completed, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Completar dia e desbloquear próximo
-- ============================================
CREATE OR REPLACE FUNCTION public.complete_program_day(
  p_user_id UUID,
  p_day_number INTEGER,
  p_reflection_text TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_xp_earned INTEGER;
  v_total_tasks INTEGER;
  v_completed_tasks INTEGER;
  v_template_id UUID;
  v_next_day_unlocked BOOLEAN;
BEGIN
  -- Buscar template e calcular XP
  SELECT 
    template_id,
    total_tasks,
    tasks_completed
  INTO v_template_id, v_total_tasks, v_completed_tasks
  FROM public.program_days
  WHERE user_id = p_user_id AND day_number = p_day_number;

  -- Calcular XP baseado no template
  SELECT COALESCE(xp_reward, 50) INTO v_xp_earned
  FROM public.program_day_templates
  WHERE id = v_template_id;

  -- Adicionar XP das tarefas completadas
  SELECT COALESCE(SUM(pt.xp_reward), 0) INTO v_xp_earned
  FROM public.program_day_user_progress pdup
  JOIN public.program_day_tasks pt ON pt.id = pdup.task_id
  WHERE pdup.user_id = p_user_id 
    AND pdup.day_number = p_day_number 
    AND pdup.completed = TRUE;

  -- Atualizar program_days
  UPDATE public.program_days
  SET 
    completed = TRUE,
    completed_at = NOW(),
    reflection_text = p_reflection_text,
    tasks_completed = v_completed_tasks,
    total_tasks = v_total_tasks,
    xp_earned = v_xp_earned
  WHERE user_id = p_user_id AND day_number = p_day_number;

  -- Atualizar user_progress
  UPDATE public.user_progress
  SET 
    total_xp = total_xp + v_xp_earned,
    current_day = GREATEST(current_day, p_day_number),
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Desbloquear próximo dia se existir
  IF p_day_number < 90 THEN
    UPDATE public.program_days
    SET unlocked_at = NOW()
    WHERE user_id = p_user_id 
      AND day_number = p_day_number + 1
      AND completed = FALSE;
    
    v_next_day_unlocked := TRUE;
  ELSE
    v_next_day_unlocked := FALSE;
  END IF;

  RETURN json_build_object(
    'success', TRUE,
    'xp_earned', v_xp_earned,
    'next_day_unlocked', v_next_day_unlocked
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;








