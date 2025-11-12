-- ============================================
-- Fix: Corrigir cálculo de XP na função complete_program_day
-- ============================================

CREATE OR REPLACE FUNCTION public.complete_program_day(
  p_user_id UUID,
  p_day_number INTEGER,
  p_reflection_text TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_xp_earned INTEGER;
  v_template_xp INTEGER;
  v_tasks_xp INTEGER;
  v_total_tasks INTEGER;
  v_completed_tasks INTEGER;
  v_template_id UUID;
  v_next_day_unlocked BOOLEAN;
BEGIN
  -- Buscar template e informações do dia
  SELECT 
    template_id,
    total_tasks,
    tasks_completed
  INTO v_template_id, v_total_tasks, v_completed_tasks
  FROM public.program_days
  WHERE user_id = p_user_id AND day_number = p_day_number;

  -- Calcular XP baseado no template
  SELECT COALESCE(xp_reward, 50) INTO v_template_xp
  FROM public.program_day_templates
  WHERE id = v_template_id;

  -- Calcular XP das tarefas completadas
  SELECT COALESCE(SUM(pt.xp_reward), 0) INTO v_tasks_xp
  FROM public.program_day_user_progress pdup
  JOIN public.program_day_tasks pt ON pt.id = pdup.task_id
  WHERE pdup.user_id = p_user_id 
    AND pdup.day_number = p_day_number 
    AND pdup.completed = TRUE;

  -- Total de XP = XP do template + XP das tarefas
  v_xp_earned := COALESCE(v_template_xp, 50) + COALESCE(v_tasks_xp, 0);

  -- Contar tarefas completadas
  SELECT COUNT(*) INTO v_completed_tasks
  FROM public.program_day_user_progress
  WHERE user_id = p_user_id 
    AND day_number = p_day_number 
    AND completed = TRUE;

  -- Contar total de tarefas
  SELECT COUNT(*) INTO v_total_tasks
  FROM public.program_day_tasks
  WHERE template_id = v_template_id;

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

