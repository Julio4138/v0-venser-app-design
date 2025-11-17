-- ============================================
-- Dopamine Activities Table
-- Armazena as atividades que geram dopamina para visualização no Dopamine Visualiser
-- ============================================

-- Tabela para armazenar atividades de dopamina
CREATE TABLE IF NOT EXISTS public.dopamine_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title_pt TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_es TEXT NOT NULL,
  description_pt TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_es TEXT NOT NULL,
  category_pt TEXT NOT NULL, -- Ex: "Exercício", "Social", "Criatividade", "Aprendizado", "Natureza"
  category_en TEXT NOT NULL,
  category_es TEXT NOT NULL,
  dopamine_level INTEGER NOT NULL CHECK (dopamine_level >= 1 AND dopamine_level <= 10), -- Nível de dopamina (1-10)
  icon_name TEXT, -- Nome do ícone do lucide-react
  color_hex TEXT DEFAULT '#f59e0b', -- Cor hexadecimal para visualização
  display_order INTEGER DEFAULT 0, -- Ordem de exibição
  is_active BOOLEAN DEFAULT TRUE, -- Se a atividade está ativa e visível
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_dopamine_activities_is_active 
  ON public.dopamine_activities(is_active);

CREATE INDEX IF NOT EXISTS idx_dopamine_activities_display_order 
  ON public.dopamine_activities(display_order);

CREATE INDEX IF NOT EXISTS idx_dopamine_activities_category_pt 
  ON public.dopamine_activities(category_pt);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_dopamine_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_dopamine_activities_updated_at ON public.dopamine_activities;
CREATE TRIGGER update_dopamine_activities_updated_at
  BEFORE UPDATE ON public.dopamine_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_dopamine_activities_updated_at();

-- Habilitar RLS
ALTER TABLE public.dopamine_activities ENABLE ROW LEVEL SECURITY;

-- Policies para Dopamine Activities
-- Todos os usuários autenticados podem ver atividades ativas
CREATE POLICY "Anyone can view active dopamine activities"
  ON public.dopamine_activities FOR SELECT
  USING (is_active = TRUE OR auth.uid() IN (
    SELECT id FROM public.profiles WHERE is_pro = TRUE
  ));

-- Apenas administradores podem inserir atividades
CREATE POLICY "Only admins can insert dopamine activities"
  ON public.dopamine_activities FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_pro = TRUE)
  );

-- Apenas administradores podem atualizar atividades
CREATE POLICY "Only admins can update dopamine activities"
  ON public.dopamine_activities FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_pro = TRUE)
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_pro = TRUE)
  );

-- Apenas administradores podem deletar atividades
CREATE POLICY "Only admins can delete dopamine activities"
  ON public.dopamine_activities FOR DELETE
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_pro = TRUE)
  );

-- Inserir atividades padrão
INSERT INTO public.dopamine_activities (
  title_pt, title_en, title_es,
  description_pt, description_en, description_es,
  category_pt, category_en, category_es,
  dopamine_level, icon_name, color_hex, display_order, is_active
) VALUES
(
  'Exercício Físico',
  'Physical Exercise',
  'Ejercicio Físico',
  'Correr, malhar, fazer yoga ou qualquer atividade física regular',
  'Running, working out, doing yoga or any regular physical activity',
  'Correr, entrenar, hacer yoga o cualquier actividad física regular',
  'Exercício',
  'Exercise',
  'Ejercicio',
  8,
  'Dumbbell',
  '#10b981',
  1,
  TRUE
),
(
  'Meditação',
  'Meditation',
  'Meditación',
  'Praticar meditação ou mindfulness diariamente',
  'Practicing meditation or mindfulness daily',
  'Practicar meditación o mindfulness diariamente',
  'Bem-estar',
  'Wellbeing',
  'Bienestar',
  7,
  'Brain',
  '#8b5cf6',
  2,
  TRUE
),
(
  'Ler um Livro',
  'Read a Book',
  'Leer un Libro',
  'Ler livros educativos, ficção ou não-ficção',
  'Reading educational books, fiction or non-fiction',
  'Leer libros educativos, ficción o no ficción',
  'Aprendizado',
  'Learning',
  'Aprendizaje',
  6,
  'BookOpen',
  '#3b82f6',
  3,
  TRUE
),
(
  'Conversar com Amigos',
  'Talk with Friends',
  'Hablar con Amigos',
  'Passar tempo de qualidade com amigos e familiares',
  'Spending quality time with friends and family',
  'Pasar tiempo de calidad con amigos y familiares',
  'Social',
  'Social',
  'Social',
  7,
  'Users',
  '#ec4899',
  4,
  TRUE
),
(
  'Criar Algo',
  'Create Something',
  'Crear Algo',
  'Desenhar, escrever, tocar música ou qualquer atividade criativa',
  'Drawing, writing, playing music or any creative activity',
  'Dibujar, escribir, tocar música o cualquier actividad creativa',
  'Criatividade',
  'Creativity',
  'Creatividad',
  7,
  'Palette',
  '#f59e0b',
  5,
  TRUE
),
(
  'Caminhar na Natureza',
  'Walk in Nature',
  'Caminar en la Naturaleza',
  'Fazer uma caminhada ao ar livre, no parque ou na praia',
  'Taking a walk outdoors, in the park or at the beach',
  'Dar un paseo al aire libre, en el parque o en la playa',
  'Natureza',
  'Nature',
  'Naturaleza',
  8,
  'TreePine',
  '#22c55e',
  6,
  TRUE
),
(
  'Aprender uma Nova Habilidade',
  'Learn a New Skill',
  'Aprender una Nueva Habilidad',
  'Estudar algo novo, fazer um curso online ou praticar uma habilidade',
  'Studying something new, taking an online course or practicing a skill',
  'Estudar algo nuevo, hacer un curso en línea o practicar una habilidad',
  'Aprendizado',
  'Learning',
  'Aprendizaje',
  7,
  'GraduationCap',
  '#06b6d4',
  7,
  TRUE
),
(
  'Fazer uma Boa Ação',
  'Do a Good Deed',
  'Hacer una Buena Acción',
  'Ajudar alguém, fazer voluntariado ou fazer algo gentil',
  'Helping someone, volunteering or doing something kind',
  'Ayudar a alguien, hacer voluntariado o hacer algo amable',
  'Social',
  'Social',
  'Social',
  9,
  'Heart',
  '#ef4444',
  8,
  TRUE
),
(
  'Completar uma Tarefa',
  'Complete a Task',
  'Completar una Tarea',
  'Finalizar um projeto ou tarefa importante',
  'Finishing an important project or task',
  'Finalizar un proyecto o tarea importante',
  'Produtividade',
  'Productivity',
  'Productividad',
  6,
  'CheckCircle2',
  '#10b981',
  9,
  TRUE
),
(
  'Cozinhar uma Refeição Saudável',
  'Cook a Healthy Meal',
  'Cocinar una Comida Saludable',
  'Preparar uma refeição nutritiva e saborosa',
  'Preparing a nutritious and tasty meal',
  'Preparar una comida nutritiva y sabrosa',
  'Bem-estar',
  'Wellbeing',
  'Bienestar',
  6,
  'UtensilsCrossed',
  '#f97316',
  10,
  TRUE
)
ON CONFLICT DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE public.dopamine_activities IS 'Armazena as atividades que geram dopamina para visualização no Dopamine Visualiser';
COMMENT ON COLUMN public.dopamine_activities.title_pt IS 'Título da atividade em português';
COMMENT ON COLUMN public.dopamine_activities.dopamine_level IS 'Nível de dopamina gerado pela atividade (1-10)';
COMMENT ON COLUMN public.dopamine_activities.icon_name IS 'Nome do ícone do lucide-react para exibição';
COMMENT ON COLUMN public.dopamine_activities.color_hex IS 'Cor hexadecimal para visualização da atividade';

