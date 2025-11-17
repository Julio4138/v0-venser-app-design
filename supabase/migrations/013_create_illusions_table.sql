-- ============================================
-- Illusions Table
-- Armazena as ilusões disponíveis para destruir no Illusion Buster
-- ============================================

-- Tabela para armazenar ilusões
CREATE TABLE IF NOT EXISTS public.illusions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title_pt TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_es TEXT NOT NULL,
  description_pt TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_es TEXT NOT NULL,
  reality_pt TEXT NOT NULL,
  reality_en TEXT NOT NULL,
  reality_es TEXT NOT NULL,
  category_pt TEXT NOT NULL,
  category_en TEXT NOT NULL,
  category_es TEXT NOT NULL,
  xp_reward INTEGER DEFAULT 50,
  display_order INTEGER DEFAULT 0, -- Ordem de exibição
  is_active BOOLEAN DEFAULT TRUE, -- Se a ilusão está ativa e visível
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_illusions_is_active 
  ON public.illusions(is_active);

CREATE INDEX IF NOT EXISTS idx_illusions_display_order 
  ON public.illusions(display_order);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_illusions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_illusions_updated_at ON public.illusions;
CREATE TRIGGER update_illusions_updated_at
  BEFORE UPDATE ON public.illusions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_illusions_updated_at();

-- Habilitar RLS
ALTER TABLE public.illusions ENABLE ROW LEVEL SECURITY;

-- Policies para Illusions
-- Todos os usuários autenticados podem ver ilusões ativas
CREATE POLICY "Anyone can view active illusions"
  ON public.illusions FOR SELECT
  USING (is_active = TRUE OR auth.uid() IN (
    SELECT id FROM public.profiles WHERE is_pro = TRUE
  ));

-- Apenas administradores podem inserir ilusões
CREATE POLICY "Only admins can insert illusions"
  ON public.illusions FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_pro = TRUE)
  );

-- Apenas administradores podem atualizar ilusões
CREATE POLICY "Only admins can update illusions"
  ON public.illusions FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_pro = TRUE)
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_pro = TRUE)
  );

-- Apenas administradores podem deletar ilusões
CREATE POLICY "Only admins can delete illusions"
  ON public.illusions FOR DELETE
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_pro = TRUE)
  );

-- Inserir ilusões padrão existentes
INSERT INTO public.illusions (
  title_pt, title_en, title_es,
  description_pt, description_en, description_es,
  reality_pt, reality_en, reality_es,
  category_pt, category_en, category_es,
  xp_reward, display_order, is_active
) VALUES
(
  'Vou usar apenas uma vez',
  'I''ll just use it once',
  'Lo usaré solo una vez',
  'Acreditar que você pode controlar o uso e parar quando quiser',
  'Believing you can control usage and stop whenever you want',
  'Creer que puedes controlar el uso y parar cuando quieras',
  'O vício funciona através do sistema de recompensa do cérebro. Cada uso reforça o comportamento, tornando mais difícil resistir na próxima vez. O ''apenas uma vez'' é uma armadilha mental que o vício usa para te manter preso. A pornografia é projetada para ser viciante - cada visualização aumenta o desejo pela próxima.',
  'Addiction works through the brain''s reward system. Each use reinforces the behavior, making it harder to resist next time. ''Just once'' is a mental trap that addiction uses to keep you trapped. Pornography is designed to be addictive - each viewing increases the desire for the next.',
  'La adicción funciona a través del sistema de recompensa del cerebro. Cada uso refuerza el comportamiento, haciendo más difícil resistir la próxima vez. El ''solo una vez'' es una trampa mental que la adicción usa para mantenerte atrapado. La pornografía está diseñada para ser adictiva - cada visualización aumenta el deseo por la siguiente.',
  'Controle',
  'Control',
  'Control',
  50,
  1,
  TRUE
),
(
  'Isso me ajuda a relaxar',
  'This helps me relax',
  'Esto me ayuda a relajarme',
  'Pensar que o comportamento problemático é uma solução para o estresse',
  'Thinking the problematic behavior is a solution for stress',
  'Pensar que el comportamiento problemático es una solución para el estrés',
  'O alívio é temporário e ilusório. O que você sente é uma fuga momentânea, mas o estresse e a ansiedade retornam ainda mais fortes. A pornografia cria um ciclo vicioso: você usa para escapar do estresse, mas isso aumenta a ansiedade e a depressão, criando mais necessidade de usar novamente. O verdadeiro relaxamento vem de técnicas saudáveis como meditação, exercícios e conexões genuínas.',
  'The relief is temporary and illusory. What you feel is a momentary escape, but stress and anxiety return even stronger. Pornography creates a vicious cycle: you use it to escape stress, but this increases anxiety and depression, creating more need to use again. True relaxation comes from healthy techniques like meditation, exercise, and genuine connections.',
  'El alivio es temporal e ilusorio. Lo que sientes es un escape momentáneo, pero el estrés y la ansiedad regresan aún más fuertes. La pornografía crea un círculo vicioso: la usas para escapar del estrés, pero esto aumenta la ansiedad y la depresión, creando más necesidad de usarla nuevamente. El verdadero relax viene de técnicas saludables como meditación, ejercicios y conexiones genuinas.',
  'Bem-estar',
  'Wellbeing',
  'Bienestar',
  50,
  2,
  TRUE
),
(
  'Não é tão ruim assim',
  'It''s not that bad',
  'No es tan malo',
  'Minimizar as consequências negativas do comportamento',
  'Minimizing the negative consequences of the behavior',
  'Minimizar las consecuencias negativas del comportamiento',
  'Seu cérebro está distorcendo a realidade para proteger o vício. As consequências são reais: perda de tempo, energia, relacionamentos, saúde mental e física. A pornografia afeta sua visão de relacionamentos reais, sua capacidade de intimidade, sua autoestima e sua energia. Reconhecer o impacto real é o primeiro passo para a mudança.',
  'Your brain is distorting reality to protect the addiction. The consequences are real: loss of time, energy, relationships, mental and physical health. Pornography affects your view of real relationships, your capacity for intimacy, your self-esteem, and your energy. Recognizing the real impact is the first step to change.',
  'Tu cerebro está distorsionando la realidad para proteger la adicción. Las consecuencias son reales: pérdida de tiempo, energía, relaciones, salud mental y física. La pornografía afecta tu visión de relaciones reales, tu capacidad de intimidad, tu autoestima y tu energía. Reconocer el impacto real es el primer paso para el cambio.',
  'Realidade',
  'Reality',
  'Realidad',
  50,
  3,
  TRUE
),
(
  'Preciso disso para funcionar',
  'I need this to function',
  'Necesito esto para funcionar',
  'Acreditar que o comportamento é necessário para seu desempenho diário',
  'Believing the behavior is necessary for your daily performance',
  'Creer que el comportamiento es necesario para tu desempeño diario',
  'Isso é dependência, não necessidade. Seu cérebro adaptou-se ao comportamento, mas você pode recondicioná-lo. A pornografia não melhora seu desempenho - na verdade, ela drena sua energia, reduz sua motivação e afeta sua capacidade de foco. Com tempo e técnicas adequadas, você descobrirá que pode funcionar melhor sem isso, com mais clareza e energia genuína.',
  'That''s dependence, not need. Your brain has adapted to the behavior, but you can recondition it. Pornography doesn''t improve your performance - in fact, it drains your energy, reduces your motivation, and affects your ability to focus. With time and proper techniques, you''ll discover you can function better without it, with more clarity and genuine energy.',
  'Eso es dependencia, no necesidad. Tu cerebro se ha adaptado al comportamiento, pero puedes recondicionarlo. La pornografía no mejora tu desempeño - de hecho, drena tu energía, reduce tu motivación y afecta tu capacidad de enfoque. Con tiempo y técnicas adecuadas, descubrirás que puedes funcionar mejor sin eso, con más claridad y energía genuina.',
  'Dependência',
  'Dependence',
  'Dependencia',
  50,
  4,
  TRUE
),
(
  'Todos fazem isso',
  'Everyone does this',
  'Todos lo hacen',
  'Usar a normalização social como justificativa',
  'Using social normalization as justification',
  'Usar la normalización social como justificación',
  'Nem todos fazem, e mesmo que fizessem, isso não torna o comportamento saudável para você. Muitas pessoas estão lutando contra esse vício em silêncio. Você está aqui porque reconheceu que isso está afetando sua vida negativamente. Foque no que é melhor para você, não nos outros. Sua jornada de recuperação é única e válida.',
  'Not everyone does, and even if they did, that doesn''t make the behavior healthy for you. Many people are struggling with this addiction in silence. You''re here because you recognized this is negatively affecting your life. Focus on what''s best for you, not others. Your recovery journey is unique and valid.',
  'No todos lo hacen, y aunque lo hicieran, eso no hace el comportamiento saludable para ti. Muchas personas están luchando contra esta adicción en silencio. Estás aquí porque reconociste que esto está afectando tu vida negativamente. Enfócate en lo que es mejor para ti, no en los demás. Tu viaje de recuperación es único y válido.',
  'Social',
  'Social',
  'Social',
  50,
  5,
  TRUE
),
(
  'Não consigo parar, é muito difícil',
  'I can''t stop, it''s too hard',
  'No puedo parar, es muy difícil',
  'Acreditar que mudar é impossível ou muito difícil',
  'Believing change is impossible or too difficult',
  'Creer que cambiar es imposible o muy difícil',
  'Mudar é desafiador, mas não impossível. Milhões de pessoas conseguiram. Você já deu o primeiro passo ao reconhecer o problema. Com suporte, técnicas adequadas e determinação, você pode superar isso. A recuperação não é linear - haverá altos e baixos, mas cada dia sem o vício é uma vitória. Um dia de cada vez, você pode vencer.',
  'Change is challenging but not impossible. Millions of people have succeeded. You''ve already taken the first step by recognizing the problem. With support, proper techniques, and determination, you can overcome this. Recovery is not linear - there will be ups and downs, but each day without the addiction is a victory. One day at a time, you can win.',
  'Cambiar es desafiante, pero no imposible. Millones de personas lo lograron. Ya diste el primer paso al reconocer el problema. Con apoyo, técnicas adecuadas y determinación, puedes superarlo. La recuperación no es lineal - habrá altibajos, pero cada día sin la adicción es una victoria. Un día a la vez, puedes vencer.',
  'Mudança',
  'Change',
  'Cambio',
  50,
  6,
  TRUE
)
ON CONFLICT DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE public.illusions IS 'Armazena as ilusões disponíveis para destruir no Illusion Buster';
COMMENT ON COLUMN public.illusions.title_pt IS 'Título da ilusão em português';
COMMENT ON COLUMN public.illusions.title_en IS 'Título da ilusão em inglês';
COMMENT ON COLUMN public.illusions.title_es IS 'Título da ilusão em espanhol';
COMMENT ON COLUMN public.illusions.description_pt IS 'Descrição da ilusão em português';
COMMENT ON COLUMN public.illusions.reality_pt IS 'Texto da realidade que revela a verdade sobre a ilusão em português';
COMMENT ON COLUMN public.illusions.category_pt IS 'Categoria da ilusão em português';
COMMENT ON COLUMN public.illusions.xp_reward IS 'XP ganho ao destruir esta ilusão';
COMMENT ON COLUMN public.illusions.display_order IS 'Ordem de exibição das ilusões';
COMMENT ON COLUMN public.illusions.is_active IS 'Se a ilusão está ativa e visível para os usuários';

