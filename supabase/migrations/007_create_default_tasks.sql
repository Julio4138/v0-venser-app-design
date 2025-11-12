-- ============================================
-- Criar Tarefas Padrão para os Templates dos 90 Dias
-- Cada dia terá tarefas básicas que podem ser editadas pelo admin
-- ============================================

-- Função auxiliar para criar tarefas padrão para um template
CREATE OR REPLACE FUNCTION create_default_tasks(p_template_id UUID, p_day_number INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Tarefa 1: Leitura do conteúdo do dia (obrigatória)
  INSERT INTO public.program_day_tasks (
    template_id,
    task_order,
    title_pt,
    title_en,
    title_es,
    description_pt,
    description_en,
    description_es,
    task_type,
    xp_reward,
    is_required
  ) VALUES (
    p_template_id,
    1,
    'Ler o conteúdo do dia',
    'Read the day''s content',
    'Leer el contenido del día',
    'Leia atentamente o conteúdo motivacional do dia e reflita sobre as mensagens.',
    'Read carefully the day''s motivational content and reflect on the messages.',
    'Lee atentamente el contenido motivacional del día y reflexiona sobre los mensajes.',
    'reading',
    15,
    TRUE
  )
  ON CONFLICT (template_id, task_order) DO NOTHING;

  -- Tarefa 2: Reflexão diária (obrigatória)
  INSERT INTO public.program_day_tasks (
    template_id,
    task_order,
    title_pt,
    title_en,
    title_es,
    description_pt,
    description_en,
    description_es,
    task_type,
    xp_reward,
    is_required
  ) VALUES (
    p_template_id,
    2,
    'Fazer reflexão do dia',
    'Make daily reflection',
    'Hacer reflexión del día',
    'Reserve alguns minutos para refletir sobre o que você aprendeu hoje e como pode aplicar isso em sua vida.',
    'Take a few minutes to reflect on what you learned today and how you can apply it to your life.',
    'Tómate unos minutos para reflexionar sobre lo que aprendiste hoy y cómo puedes aplicarlo en tu vida.',
    'reflection',
    20,
    TRUE
  )
  ON CONFLICT (template_id, task_order) DO NOTHING;

  -- Tarefa 3: Checklist de autocuidado (obrigatória)
  INSERT INTO public.program_day_tasks (
    template_id,
    task_order,
    title_pt,
    title_en,
    title_es,
    description_pt,
    description_en,
    description_es,
    task_type,
    xp_reward,
    is_required
  ) VALUES (
    p_template_id,
    3,
    'Praticar autocuidado',
    'Practice self-care',
    'Practicar autocuidado',
    'Realize pelo menos uma atividade de autocuidado hoje (exercício, meditação, leitura, etc.).',
    'Perform at least one self-care activity today (exercise, meditation, reading, etc.).',
    'Realiza al menos una actividad de autocuidado hoy (ejercicio, meditación, lectura, etc.).',
    'checklist',
    10,
    TRUE
  )
  ON CONFLICT (template_id, task_order) DO NOTHING;

  -- Tarefa 4: Meditação/Respiração (opcional para alguns dias)
  IF p_day_number IN (1, 6, 15, 22, 31, 45, 61, 68, 75, 82) THEN
    INSERT INTO public.program_day_tasks (
      template_id,
      task_order,
      title_pt,
      title_en,
      title_es,
      description_pt,
      description_en,
      description_es,
      task_type,
      xp_reward,
      is_required
    ) VALUES (
      p_template_id,
      4,
      'Praticar meditação ou respiração',
      'Practice meditation or breathing',
      'Practicar meditación o respiración',
      'Dedique 5-10 minutos para meditação ou exercícios de respiração consciente.',
      'Dedicate 5-10 minutes to meditation or conscious breathing exercises.',
      'Dedica 5-10 minutos a la meditación o ejercicios de respiración consciente.',
      'meditation',
      15,
      FALSE
    )
    ON CONFLICT (template_id, task_order) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Criar tarefas para todos os templates
DO $$
DECLARE
  template_record RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR template_record IN 
    SELECT id, day_number 
    FROM public.program_day_templates 
    ORDER BY day_number
  LOOP
    PERFORM create_default_tasks(template_record.id, template_record.day_number);
    v_count := v_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Tarefas criadas para % templates', v_count;
END $$;

-- Limpar função auxiliar
DROP FUNCTION IF EXISTS create_default_tasks(UUID, INTEGER);

-- Verificar quantas tarefas foram criadas
DO $$
DECLARE
  v_task_count INTEGER;
  v_template_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_task_count FROM public.program_day_tasks;
  SELECT COUNT(*) INTO v_template_count FROM public.program_day_templates;
  
  RAISE NOTICE 'Total de templates: %', v_template_count;
  RAISE NOTICE 'Total de tarefas criadas: %', v_task_count;
  
  IF v_task_count >= (v_template_count * 3) THEN
    RAISE NOTICE '✅ Tarefas padrão criadas com sucesso!';
  ELSE
    RAISE WARNING '⚠️ Verifique se todas as tarefas foram criadas corretamente.';
  END IF;
END $$;

