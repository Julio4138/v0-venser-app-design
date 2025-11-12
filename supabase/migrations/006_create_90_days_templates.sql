-- ============================================
-- Criar Templates dos 90 Dias do Programa
-- Estrutura em 3 Fases: Reconstrução, Redirecionamento e Consolidação
-- ============================================

-- Função auxiliar para criar template de um dia
CREATE OR REPLACE FUNCTION create_day_template(
  p_day_number INTEGER,
  p_title_pt TEXT,
  p_title_en TEXT DEFAULT NULL,
  p_title_es TEXT DEFAULT NULL,
  p_content_text_pt TEXT DEFAULT NULL,
  p_content_text_en TEXT DEFAULT NULL,
  p_content_text_es TEXT DEFAULT NULL,
  p_quote_pt TEXT DEFAULT NULL,
  p_quote_en TEXT DEFAULT NULL,
  p_quote_es TEXT DEFAULT NULL,
  p_xp_reward INTEGER DEFAULT 50
)
RETURNS UUID AS $$
DECLARE
  v_template_id UUID;
BEGIN
  INSERT INTO public.program_day_templates (
    day_number,
    title_pt,
    title_en,
    title_es,
    content_text_pt,
    content_text_en,
    content_text_es,
    motivational_quote_pt,
    motivational_quote_en,
    motivational_quote_es,
    xp_reward,
    is_active
  ) VALUES (
    p_day_number,
    p_title_pt,
    COALESCE(p_title_en, p_title_pt),
    COALESCE(p_title_es, p_title_pt),
    COALESCE(p_content_text_pt, 'Conteúdo será adicionado em breve.'),
    COALESCE(p_content_text_en, 'Content will be added soon.'),
    COALESCE(p_content_text_es, 'El contenido se agregará pronto.'),
    COALESCE(p_quote_pt, 'Cada dia é uma nova oportunidade de crescimento.'),
    COALESCE(p_quote_en, 'Each day is a new opportunity for growth.'),
    COALESCE(p_quote_es, 'Cada día es una nueva oportunidad de crecimiento.'),
    p_xp_reward,
    TRUE
  )
  ON CONFLICT (day_number) DO UPDATE SET
    title_pt = EXCLUDED.title_pt,
    title_en = EXCLUDED.title_en,
    title_es = EXCLUDED.title_es,
    updated_at = NOW()
  RETURNING id INTO v_template_id;
  
  RETURN v_template_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FASE 1: RECONSTRUÇÃO DA MENTE E QUEBRA DO CICLO (Dias 1-30)
-- Objetivo: Romper padrões automáticos e criar consciência
-- ============================================

-- Semana 1: Consciência e Reconhecimento (Dias 1-7)
SELECT create_day_template(1, 
  'Bem-vindo à Sua Jornada de Transformação',
  'Welcome to Your Transformation Journey',
  'Bienvenido a Tu Jornada de Transformación',
  'Hoje marca o início de uma nova fase da sua vida. Você tomou a decisão consciente de se libertar e reconstruir sua mente. Este é o primeiro passo de muitos que virão.',
  'Today marks the beginning of a new phase in your life. You have made the conscious decision to free yourself and rebuild your mind. This is the first of many steps to come.',
  'Hoy marca el comienzo de una nueva fase en tu vida. Has tomado la decisión consciente de liberarte y reconstruir tu mente. Este es el primero de muchos pasos por venir.',
  'A jornada de mil milhas começa com um único passo.',
  'The journey of a thousand miles begins with a single step.',
  'El viaje de mil millas comienza con un solo paso.',
  50
);

SELECT create_day_template(2, 
  'Entendendo os Padrões Automáticos',
  'Understanding Automatic Patterns',
  'Entendiendo los Patrones Automáticos',
  'Nossa mente funciona em padrões. Hoje vamos começar a identificar os padrões que nos mantêm presos e criar consciência sobre eles.',
  'Our mind works in patterns. Today we will begin to identify the patterns that keep us trapped and create awareness about them.',
  'Nuestra mente funciona en patrones. Hoy comenzaremos a identificar los patrones que nos mantienen atrapados y crear conciencia sobre ellos.',
  'A consciência é o primeiro passo para a mudança.',
  'Awareness is the first step to change.',
  'La conciencia es el primer paso hacia el cambio.',
  50
);

SELECT create_day_template(3, 
  'Reconhecendo Gatilhos',
  'Recognizing Triggers',
  'Reconociendo los Desencadenantes',
  'Gatilhos são situações, emoções ou pensamentos que desencadeiam comportamentos automáticos. Hoje vamos mapear seus gatilhos pessoais.',
  'Triggers are situations, emotions, or thoughts that trigger automatic behaviors. Today we will map your personal triggers.',
  'Los desencadenantes son situaciones, emociones o pensamientos que activan comportamientos automáticos. Hoy mapearemos tus desencadenantes personales.',
  'Conhecer seus gatilhos é conhecer a si mesmo.',
  'Knowing your triggers is knowing yourself.',
  'Conocer tus desencadenantes es conocerte a ti mismo.',
  50
);

SELECT create_day_template(4, 
  'Quebrando o Ciclo de Recompensa',
  'Breaking the Reward Cycle',
  'Rompiendo el Ciclo de Recompensa',
  'O cérebro cria conexões neurais baseadas em recompensas. Hoje vamos entender como essas conexões se formam e como podemos reconfigurá-las.',
  'The brain creates neural connections based on rewards. Today we will understand how these connections form and how we can reconfigure them.',
  'El cerebro crea conexiones neuronales basadas en recompensas. Hoy entenderemos cómo se forman estas conexiones y cómo podemos reconfigurarlas.',
  'Neuroplasticidade: seu cérebro pode mudar.',
  'Neuroplasticity: your brain can change.',
  'Neuroplasticidad: tu cerebro puede cambiar.',
  50
);

SELECT create_day_template(5, 
  'Criando Espaço Entre Estímulo e Resposta',
  'Creating Space Between Stimulus and Response',
  'Creando Espacio Entre Estímulo y Respuesta',
  'Entre o estímulo e a resposta há um espaço. Nesse espaço está nosso poder de escolha. Hoje vamos praticar expandir esse espaço.',
  'Between stimulus and response there is a space. In that space is our power to choose. Today we will practice expanding that space.',
  'Entre el estímulo y la respuesta hay un espacio. En ese espacio está nuestro poder de elección. Hoy practicaremos expandir ese espacio.',
  'No podemos controlar o vento, mas podemos ajustar as velas.',
  'We cannot control the wind, but we can adjust the sails.',
  'No podemos controlar el viento, pero podemos ajustar las velas.',
  50
);

SELECT create_day_template(6, 
  'Técnicas de Respiração e Grounding',
  'Breathing and Grounding Techniques',
  'Técnicas de Respiración y Conexión a Tierra',
  'A respiração consciente é uma ferramenta poderosa para acalmar a mente e criar presença. Vamos praticar técnicas de grounding hoje.',
  'Conscious breathing is a powerful tool to calm the mind and create presence. Let''s practice grounding techniques today.',
  'La respiración consciente es una herramienta poderosa para calmar la mente y crear presencia. Practiquemos técnicas de conexión a tierra hoy.',
  'Respire fundo. Você está aqui. Você está seguro.',
  'Breathe deeply. You are here. You are safe.',
  'Respira profundamente. Estás aquí. Estás seguro.',
  50
);

SELECT create_day_template(7, 
  'Primeira Semana: Reflexão e Celebração',
  'First Week: Reflection and Celebration',
  'Primera Semana: Reflexión y Celebración',
  'Você completou sua primeira semana! Este é um marco importante. Vamos refletir sobre o que aprendemos e celebrar seu progresso.',
  'You completed your first week! This is an important milestone. Let''s reflect on what we learned and celebrate your progress.',
  '¡Completaste tu primera semana! Este es un hito importante. Reflexionemos sobre lo que aprendimos y celebremos tu progreso.',
  'Cada pequena vitória é um passo em direção à liberdade.',
  'Every small victory is a step toward freedom.',
  'Cada pequeña victoria es un paso hacia la libertad.',
  75
);

-- Semana 2: Reestruturação Cognitiva (Dias 8-14)
SELECT create_day_template(8, 'Reestruturando Pensamentos Negativos', 'Restructuring Negative Thoughts', 'Reestructurando Pensamientos Negativos', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(9, 'Criando Novas Narrativas', 'Creating New Narratives', 'Creando Nuevas Narrativas', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(10, 'Trabalhando com Emoções Difíceis', 'Working with Difficult Emotions', 'Trabajando con Emociones Difíciles', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(11, 'Desenvolvendo Autocompaixão', 'Developing Self-Compassion', 'Desarrollando Autocompasión', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(12, 'Técnicas de Mindfulness', 'Mindfulness Techniques', 'Técnicas de Mindfulness', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(13, 'Construindo Resiliência', 'Building Resilience', 'Construyendo Resiliencia', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(14, 'Segunda Semana: Consolidando Aprendizados', 'Second Week: Consolidating Learnings', 'Segunda Semana: Consolidando Aprendizajes', NULL, NULL, NULL, NULL, NULL, NULL, 75);

-- Semana 3: Novos Hábitos (Dias 15-21)
SELECT create_day_template(15, 'Introduzindo Novos Hábitos', 'Introducing New Habits', 'Introduciendo Nuevos Hábitos', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(16, 'Rotina Matinal Transformadora', 'Transformative Morning Routine', 'Rutina Matutina Transformadora', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(17, 'Exercício e Movimento', 'Exercise and Movement', 'Ejercicio y Movimiento', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(18, 'Alimentação Consciente', 'Conscious Nutrition', 'Nutrición Consciente', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(19, 'Sono e Recuperação', 'Sleep and Recovery', 'Sueño y Recuperación', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(20, 'Conexão Social Saudável', 'Healthy Social Connection', 'Conexión Social Saludable', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(21, 'Terceira Semana: Hábitos em Formação', 'Third Week: Habits in Formation', 'Tercera Semana: Hábitos en Formación', NULL, NULL, NULL, NULL, NULL, NULL, 75);

-- Semana 4: Fortalecimento (Dias 22-28)
SELECT create_day_template(22, 'Fortalecendo a Vontade', 'Strengthening Willpower', 'Fortalecimiento de la Voluntad', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(23, 'Lidando com Desejos Intensos', 'Dealing with Intense Cravings', 'Lidiando con Deseos Intensos', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(24, 'Estratégias de Prevenção de Recaída', 'Relapse Prevention Strategies', 'Estrategias de Prevención de Recaída', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(25, 'Construindo uma Rede de Apoio', 'Building a Support Network', 'Construyendo una Red de Apoyo', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(26, 'Valores e Propósito', 'Values and Purpose', 'Valores y Propósito', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(27, 'Visualização e Metas', 'Visualization and Goals', 'Visualización y Metas', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(28, 'Quarta Semana: Marco de Um Mês', 'Fourth Week: One Month Milestone', 'Cuarta Semana: Hito de Un Mes', NULL, NULL, NULL, NULL, NULL, NULL, 100);

-- Final da Fase 1 (Dias 29-30)
SELECT create_day_template(29, 'Consolidando a Fase de Reconstrução', 'Consolidating the Reconstruction Phase', 'Consolidando la Fase de Reconstrucción', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(30, 'Transição para a Fase 2', 'Transition to Phase 2', 'Transición a la Fase 2', NULL, NULL, NULL, NULL, NULL, NULL, 75);

-- ============================================
-- FASE 2: REDIRECIONAMENTO E REFORÇO DE HÁBITOS (Dias 31-60)
-- Objetivo: Substituir vícios por comportamentos saudáveis
-- ============================================

-- Semana 5: Substituição de Comportamentos (Dias 31-37)
SELECT create_day_template(31, 'Iniciando a Fase de Redirecionamento', 'Starting the Redirection Phase', 'Iniciando la Fase de Redirección', NULL, NULL, NULL, NULL, NULL, NULL, 75);
SELECT create_day_template(32, 'Substituindo Comportamentos', 'Replacing Behaviors', 'Reemplazando Comportamientos', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(33, 'Criando Alternativas Saudáveis', 'Creating Healthy Alternatives', 'Creando Alternativas Saludables', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(34, 'Hobbies e Interesses Novos', 'New Hobbies and Interests', 'Nuevos Pasatiempos e Intereses', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(35, 'Desenvolvimento de Habilidades', 'Skill Development', 'Desarrollo de Habilidades', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(36, 'Criatividade e Expressão', 'Creativity and Expression', 'Creatividad y Expresión', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(37, 'Quinta Semana: Novos Caminhos', 'Fifth Week: New Paths', 'Quinta Semana: Nuevos Caminos', NULL, NULL, NULL, NULL, NULL, NULL, 75);

-- Semana 6: Reforço Positivo (Dias 38-44)
SELECT create_day_template(38, 'Sistemas de Recompensa Saudáveis', 'Healthy Reward Systems', 'Sistemas de Recompensa Saludables', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(39, 'Celebrando Pequenas Vitórias', 'Celebrating Small Victories', 'Celebrando Pequeñas Victorias', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(40, 'Gratidão e Reconhecimento', 'Gratitude and Recognition', 'Gratitud y Reconocimiento', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(41, 'Autocuidado Avançado', 'Advanced Self-Care', 'Autocuidado Avanzado', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(42, 'Equilíbrio e Moderação', 'Balance and Moderation', 'Equilibrio y Moderación', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(43, 'Gestão de Tempo e Prioridades', 'Time Management and Priorities', 'Gestión del Tiempo y Prioridades', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(44, 'Sexta Semana: Reforço Contínuo', 'Sixth Week: Continuous Reinforcement', 'Sexta Semana: Refuerzo Continuo', NULL, NULL, NULL, NULL, NULL, NULL, 75);

-- Semana 7: Profundidade (Dias 45-51)
SELECT create_day_template(45, 'Trabalhando com Crenças Limitantes', 'Working with Limiting Beliefs', 'Trabajando con Creencias Limitantes', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(46, 'Desenvolvendo Autocontrole', 'Developing Self-Control', 'Desarrollando Autocontrol', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(47, 'Inteligência Emocional', 'Emotional Intelligence', 'Inteligencia Emocional', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(48, 'Comunicação Assertiva', 'Assertive Communication', 'Comunicación Asertiva', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(49, 'Relacionamentos Saudáveis', 'Healthy Relationships', 'Relaciones Saludables', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(50, 'Estabelecendo Limites', 'Setting Boundaries', 'Estableciendo Límites', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(51, 'Sétima Semana: Profundidade e Crescimento', 'Seventh Week: Depth and Growth', 'Séptima Semana: Profundidad y Crecimiento', NULL, NULL, NULL, NULL, NULL, NULL, 75);

-- Semana 8: Consolidação da Fase 2 (Dias 52-58)
SELECT create_day_template(52, 'Hábitos em Automação', 'Habits in Automation', 'Hábitos en Automatización', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(53, 'Resistência a Tentações', 'Resistance to Temptations', 'Resistencia a las Tentaciones', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(54, 'Confiança em Si Mesmo', 'Self-Confidence', 'Confianza en Uno Mismo', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(55, 'Autoestima e Valor Próprio', 'Self-Esteem and Self-Worth', 'Autoestima y Valor Propio', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(56, 'Vida com Propósito', 'Life with Purpose', 'Vida con Propósito', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(57, 'Contribuindo para Outros', 'Contributing to Others', 'Contribuyendo a Otros', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(58, 'Oitava Semana: Dois Meses de Transformação', 'Eighth Week: Two Months of Transformation', 'Octava Semana: Dos Meses de Transformación', NULL, NULL, NULL, NULL, NULL, NULL, 100);

-- Final da Fase 2 (Dias 59-60)
SELECT create_day_template(59, 'Consolidando a Fase de Redirecionamento', 'Consolidating the Redirection Phase', 'Consolidando la Fase de Redirección', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(60, 'Preparação para a Fase Final', 'Preparation for Final Phase', 'Preparación para la Fase Final', NULL, NULL, NULL, NULL, NULL, NULL, 75);

-- ============================================
-- FASE 3: CONSOLIDAÇÃO E IDENTIDADE NOVA (Dias 61-90)
-- Objetivo: Solidificar autocontrole e visão de longo prazo
-- ============================================

-- Semana 9: Nova Identidade (Dias 61-67)
SELECT create_day_template(61, 'Iniciando a Fase de Consolidação', 'Starting the Consolidation Phase', 'Iniciando la Fase de Consolidación', NULL, NULL, NULL, NULL, NULL, NULL, 75);
SELECT create_day_template(62, 'Quem Você Se Tornou', 'Who You Have Become', 'Quién Te Has Convertido', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(63, 'Nova Identidade, Nova Vida', 'New Identity, New Life', 'Nueva Identidad, Nueva Vida', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(64, 'Valores em Ação', 'Values in Action', 'Valores en Acción', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(65, 'Visão de Longo Prazo', 'Long-Term Vision', 'Visión a Largo Plazo', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(66, 'Metas e Sonhos Renovados', 'Renewed Goals and Dreams', 'Metas y Sueños Renovados', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(67, 'Nona Semana: Identidade Transformada', 'Ninth Week: Transformed Identity', 'Novena Semana: Identidad Transformada', NULL, NULL, NULL, NULL, NULL, NULL, 75);

-- Semana 10: Autocontrole Avançado (Dias 68-74)
SELECT create_day_template(68, 'Autocontrole como Estilo de Vida', 'Self-Control as a Lifestyle', 'Autocontrol como Estilo de Vida', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(69, 'Tomando Decisões Conscientes', 'Making Conscious Decisions', 'Tomando Decisiones Conscientes', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(70, 'Resiliência em Situações Difíceis', 'Resilience in Difficult Situations', 'Resiliencia en Situaciones Difíciles', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(71, 'Mantendo o Foco', 'Maintaining Focus', 'Manteniendo el Enfoque', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(72, 'Disciplina e Compromisso', 'Discipline and Commitment', 'Disciplina y Compromiso', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(73, 'Superando Obstáculos', 'Overcoming Obstacles', 'Superando Obstáculos', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(74, 'Décima Semana: Força Interior', 'Tenth Week: Inner Strength', 'Décima Semana: Fuerza Interior', NULL, NULL, NULL, NULL, NULL, NULL, 75);

-- Semana 11: Impacto e Legado (Dias 75-81)
SELECT create_day_template(75, 'Impacto na Sua Vida', 'Impact on Your Life', 'Impacto en Tu Vida', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(76, 'Impacto na Vida dos Outros', 'Impact on Others'' Lives', 'Impacto en la Vida de Otros', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(77, 'Mentoria e Ajuda', 'Mentoring and Helping', 'Mentoría y Ayuda', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(78, 'Compartilhando Sua Jornada', 'Sharing Your Journey', 'Compartiendo Tu Jornada', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(79, 'Criando um Legado Positivo', 'Creating a Positive Legacy', 'Creando un Legado Positivo', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(80, 'Influência e Inspiração', 'Influence and Inspiration', 'Influencia e Inspiración', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(81, 'Décima Primeira Semana: Impacto Duradouro', 'Eleventh Week: Lasting Impact', 'Undécima Semana: Impacto Duradero', NULL, NULL, NULL, NULL, NULL, NULL, 75);

-- Semana 12: Consolidação Final (Dias 82-88)
SELECT create_day_template(82, 'Manutenção a Longo Prazo', 'Long-Term Maintenance', 'Mantenimiento a Largo Plazo', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(83, 'Estratégias de Manutenção', 'Maintenance Strategies', 'Estrategias de Mantenimiento', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(84, 'Plano de Ação Futuro', 'Future Action Plan', 'Plan de Acción Futuro', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(85, 'Recursos e Ferramentas', 'Resources and Tools', 'Recursos y Herramientas', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(86, 'Rede de Apoio Contínua', 'Ongoing Support Network', 'Red de Apoyo Continua', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(87, 'Celebrando o Progresso', 'Celebrating Progress', 'Celebrando el Progreso', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(88, 'Décima Segunda Semana: Quase Lá!', 'Twelfth Week: Almost There!', 'Duodécima Semana: ¡Casi Llegamos!', NULL, NULL, NULL, NULL, NULL, NULL, 75);

-- Final do Programa (Dias 89-90)
SELECT create_day_template(89, 'Reflexão Final da Jornada', 'Final Journey Reflection', 'Reflexión Final del Viaje', NULL, NULL, NULL, NULL, NULL, NULL, 50);
SELECT create_day_template(90, 'Celebração: 90 Dias de Transformação', 'Celebration: 90 Days of Transformation', 'Celebración: 90 Días de Transformación', NULL, NULL, NULL, NULL, NULL, NULL, 150);

-- Limpar função auxiliar
DROP FUNCTION IF EXISTS create_day_template(INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER);

-- Verificar quantos templates foram criados
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.program_day_templates;
  
  RAISE NOTICE 'Total de templates criados: %', v_count;
  
  IF v_count = 90 THEN
    RAISE NOTICE '✅ Todos os 90 templates foram criados com sucesso!';
  ELSE
    RAISE WARNING '⚠️ Esperado 90 templates, mas encontrado %. Verifique se houve algum erro.', v_count;
  END IF;
END $$;

