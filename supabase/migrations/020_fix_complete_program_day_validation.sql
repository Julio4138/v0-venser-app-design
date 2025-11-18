-- ============================================
-- Fix: Adicionar validações e tratamento de erros na função complete_program_day
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
  v_next_day_unlock_date TIMESTAMP WITH TIME ZONE;
  v_last_completed_date DATE;
  v_day_exists BOOLEAN;
  v_program_duration INTEGER;
  v_next_day_template_id UUID;
BEGIN
  -- Verificar se o usuário já completou um dia hoje
  SELECT MAX(completed_at::date) INTO v_last_completed_date
  FROM public.program_days
  WHERE user_id = p_user_id AND completed = TRUE;
  
  -- Se já completou um dia hoje, não permitir completar outro
  IF v_last_completed_date = CURRENT_DATE THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'already_completed_today',
      'message', 'Você já completou um dia hoje. O próximo dia será desbloqueado amanhã.'
    );
  END IF;

  -- Verificar se o dia existe
  SELECT EXISTS(
    SELECT 1 FROM public.program_days
    WHERE user_id = p_user_id AND day_number = p_day_number
  ) INTO v_day_exists;

  IF NOT v_day_exists THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'day_not_found',
      'message', 'Dia não encontrado. Por favor, recarregue a página.'
    );
  END IF;

  -- Buscar template e informações do dia
  SELECT 
    template_id,
    total_tasks,
    tasks_completed
  INTO v_template_id, v_total_tasks, v_completed_tasks
  FROM public.program_days
  WHERE user_id = p_user_id AND day_number = p_day_number;

  -- Validar se template_id existe
  IF v_template_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'template_not_found',
      'message', 'Template não encontrado para este dia. Entre em contato com o suporte.'
    );
  END IF;

  -- Verificar se o template existe
  IF NOT EXISTS(SELECT 1 FROM public.program_day_templates WHERE id = v_template_id) THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'template_not_found',
      'message', 'Template não encontrado para este dia. Entre em contato com o suporte.'
    );
  END IF;

  -- Calcular XP baseado no template
  SELECT COALESCE(xp_reward, 50) INTO v_template_xp
  FROM public.program_day_templates
  WHERE id = v_template_id;

  -- Garantir que template_xp não seja NULL
  IF v_template_xp IS NULL THEN
    v_template_xp := 50;
  END IF;

  -- Calcular XP das tarefas completadas
  SELECT COALESCE(SUM(pt.xp_reward), 0) INTO v_tasks_xp
  FROM public.program_day_user_progress pdup
  JOIN public.program_day_tasks pt ON pt.id = pdup.task_id
  WHERE pdup.user_id = p_user_id 
    AND pdup.day_number = p_day_number 
    AND pdup.completed = TRUE;

  -- Garantir que tasks_xp não seja NULL
  IF v_tasks_xp IS NULL THEN
    v_tasks_xp := 0;
  END IF;

  -- Total de XP = XP do template + XP das tarefas
  v_xp_earned := COALESCE(v_template_xp, 50) + COALESCE(v_tasks_xp, 0);

  -- Contar tarefas completadas
  SELECT COUNT(*) INTO v_completed_tasks
  FROM public.program_day_user_progress
  WHERE user_id = p_user_id 
    AND day_number = p_day_number 
    AND completed = TRUE;

  -- Garantir que completed_tasks não seja NULL
  IF v_completed_tasks IS NULL THEN
    v_completed_tasks := 0;
  END IF;

  -- Contar total de tarefas
  SELECT COUNT(*) INTO v_total_tasks
  FROM public.program_day_tasks
  WHERE template_id = v_template_id;

  -- Garantir que total_tasks não seja NULL
  IF v_total_tasks IS NULL THEN
    v_total_tasks := 0;
  END IF;

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

  -- Verificar se a atualização foi bem-sucedida
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'update_failed',
      'message', 'Falha ao atualizar o dia. Por favor, tente novamente.'
    );
  END IF;

  -- Atualizar user_progress (incluindo streak)
  UPDATE public.user_progress
  SET 
    total_xp = total_xp + v_xp_earned,
    current_day = GREATEST(current_day, p_day_number),
    total_days_clean = total_days_clean + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Calcular e atualizar streak (dias consecutivos completados)
  -- Contar dias consecutivos a partir de hoje
  WITH recent_completions AS (
    SELECT 
      completed_at::date as completion_date,
      ROW_NUMBER() OVER (ORDER BY completed_at DESC) as rn
    FROM public.program_days
    WHERE user_id = p_user_id 
      AND completed = TRUE
      AND completed_at IS NOT NULL
    ORDER BY completed_at DESC
  ),
  streak_calc AS (
    SELECT COUNT(*) as consecutive_days
    FROM recent_completions rc1
    WHERE rc1.completion_date = CURRENT_DATE - (rc1.rn::integer - 1)
  )
  UPDATE public.user_progress
  SET 
    current_streak = COALESCE((SELECT consecutive_days FROM streak_calc), 1),
    longest_streak = GREATEST(
      longest_streak, 
      COALESCE((SELECT consecutive_days FROM streak_calc), 1)
    )
  WHERE user_id = p_user_id;

  -- Desbloquear próximo dia apenas no dia seguinte (meia-noite do próximo dia)
  -- Usar a duração do programa do usuário em vez de valor fixo
  SELECT COALESCE(program_duration, 90) INTO v_program_duration
  FROM public.user_progress
  WHERE user_id = p_user_id;
  
  IF v_program_duration IS NULL THEN
    v_program_duration := 90;
  END IF;

  IF p_day_number < v_program_duration THEN
    -- Calcular data de desbloqueio: meia-noite do próximo dia
    v_next_day_unlock_date := (CURRENT_DATE + INTERVAL '1 day')::timestamp;
    
    -- Buscar template do próximo dia com base na duração do programa
    SELECT id INTO v_next_day_template_id
    FROM public.program_day_templates
    WHERE day_number = p_day_number + 1
      AND program_duration = v_program_duration
      AND is_active = TRUE
    LIMIT 1;

    -- Se não encontrar template, tentar buscar sem filtrar por program_duration
    IF v_next_day_template_id IS NULL THEN
      SELECT id INTO v_next_day_template_id
      FROM public.program_day_templates
      WHERE day_number = p_day_number + 1
        AND is_active = TRUE
      LIMIT 1;
    END IF;

    -- Criar ou atualizar o próximo dia com data de desbloqueio futura
    IF v_next_day_template_id IS NOT NULL THEN
      INSERT INTO public.program_days (user_id, day_number, template_id, unlocked_at)
      VALUES (p_user_id, p_day_number + 1, v_next_day_template_id, v_next_day_unlock_date)
      ON CONFLICT (user_id, day_number) 
      DO UPDATE SET 
        unlocked_at = v_next_day_unlock_date,
        template_id = COALESCE(program_days.template_id, v_next_day_template_id)
      WHERE program_days.completed = FALSE;
      
      v_next_day_unlocked := TRUE;
    ELSE
      v_next_day_unlocked := FALSE;
    END IF;
  ELSE
    v_next_day_unlocked := FALSE;
  END IF;

  RETURN json_build_object(
    'success', TRUE,
    'xp_earned', v_xp_earned,
    'next_day_unlocked', v_next_day_unlocked,
    'next_day_unlock_date', v_next_day_unlock_date
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Retornar erro genérico em caso de exceção não tratada
    RETURN json_build_object(
      'success', FALSE,
      'error', 'unexpected_error',
      'message', 'Erro inesperado ao completar dia: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

