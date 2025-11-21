-- ============================================
-- Research Articles Table
-- Armazena os artigos de pesquisa sobre pornografia
-- ============================================

-- Tabela para armazenar artigos de pesquisa
CREATE TABLE IF NOT EXISTS public.research_articles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title_pt TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_es TEXT NOT NULL,
  description_pt TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_es TEXT NOT NULL,
  category_pt TEXT NOT NULL,
  category_en TEXT NOT NULL,
  category_es TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'BookOpen', -- Nome do ícone do lucide-react
  icon_color TEXT NOT NULL DEFAULT 'text-orange-400',
  gradient_from TEXT NOT NULL DEFAULT 'from-orange-500/20',
  gradient_to TEXT NOT NULL DEFAULT 'to-orange-600/20',
  stats_text_pt TEXT, -- Ex: "50+ estudos"
  stats_text_en TEXT, -- Ex: "50+ studies"
  stats_text_es TEXT, -- Ex: "50+ estudios"
  external_link TEXT, -- Link externo opcional
  display_order INTEGER DEFAULT 0, -- Ordem de exibição
  is_active BOOLEAN DEFAULT TRUE, -- Se o artigo está ativo e visível
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_research_articles_is_active 
  ON public.research_articles(is_active);

CREATE INDEX IF NOT EXISTS idx_research_articles_display_order 
  ON public.research_articles(display_order);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_research_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_research_articles_updated_at ON public.research_articles;
CREATE TRIGGER update_research_articles_updated_at
  BEFORE UPDATE ON public.research_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_research_articles_updated_at();

-- Habilitar RLS
ALTER TABLE public.research_articles ENABLE ROW LEVEL SECURITY;

-- Policies para Research Articles
-- Todos os usuários autenticados podem ver artigos ativos
CREATE POLICY "Anyone can view active research articles"
  ON public.research_articles FOR SELECT
  USING (is_active = TRUE OR auth.uid() IN (
    SELECT id FROM public.profiles WHERE is_pro = TRUE
  ));

-- Apenas administradores podem inserir artigos
CREATE POLICY "Only admins can insert research articles"
  ON public.research_articles FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_pro = TRUE)
  );

-- Apenas administradores podem atualizar artigos
CREATE POLICY "Only admins can update research articles"
  ON public.research_articles FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_pro = TRUE)
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_pro = TRUE)
  );

-- Apenas administradores podem deletar artigos
CREATE POLICY "Only admins can delete research articles"
  ON public.research_articles FOR DELETE
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_pro = TRUE)
  );

-- Inserir artigos padrão existentes
INSERT INTO public.research_articles (
  title_pt, title_en, title_es,
  description_pt, description_en, description_es,
  category_pt, category_en, category_es,
  icon_name, icon_color, gradient_from, gradient_to,
  stats_text_pt, stats_text_en, stats_text_es,
  display_order, is_active
) VALUES
(
  'Efeitos no Cérebro',
  'Effects on the Brain',
  'Efectos en el Cerebro',
  'Como a pornografia afeta a estrutura e função cerebral, incluindo mudanças na matéria cinzenta e atividade neural',
  'How pornography affects brain structure and function, including changes in gray matter and neural activity',
  'Cómo la pornografía afecta la estructura y función cerebral, incluyendo cambios en la materia gris y actividad neural',
  'Neurociência',
  'Neuroscience',
  'Neurociencia',
  'BookOpen',
  'text-orange-400',
  'from-orange-500/20',
  'to-orange-600/20',
  '50+ estudos',
  '50+ studies',
  '50+ estudios',
  1,
  TRUE
),
(
  'Dependência e Dopamina',
  'Addiction and Dopamine',
  'Adicción y Dopamina',
  'Mecanismos de dependência, sistema de recompensa e como a pornografia altera os níveis de dopamina',
  'Addiction mechanisms, reward system and how pornography alters dopamine levels',
  'Mecanismos de adicción, sistema de recompensa y cómo la pornografía altera los niveles de dopamina',
  'Dependência',
  'Addiction',
  'Adicción',
  'BarChart3',
  'text-green-400',
  'from-green-500/20',
  'to-emerald-600/20',
  '30+ pesquisas',
  '30+ research',
  '30+ investigaciones',
  2,
  TRUE
),
(
  'Recuperação e Neuroplasticidade',
  'Recovery and Neuroplasticity',
  'Recuperación y Neuroplasticidad',
  'Como o cérebro se recupera e reconstrói conexões neurais após parar de consumir pornografia',
  'How the brain recovers and rebuilds neural connections after stopping pornography consumption',
  'Cómo el cerebro se recupera y reconstruye conexiones neuronales después de dejar de consumir pornografía',
  'Recuperação',
  'Recovery',
  'Recuperación',
  'Brain',
  'text-blue-400',
  'from-blue-500/20',
  'to-cyan-600/20',
  '25+ estudos',
  '25+ studies',
  '25+ estudios',
  3,
  TRUE
),
(
  'Impacto nas Relações',
  'Impact on Relationships',
  'Impacto en las Relaciones',
  'Efeitos na intimidade, conexão emocional e satisfação sexual em relacionamentos',
  'Effects on intimacy, emotional connection and sexual satisfaction in relationships',
  'Efectos en la intimidad, conexión emocional y satisfacción sexual en relaciones',
  'Relacionamentos',
  'Relationships',
  'Relaciones',
  'FileText',
  'text-purple-400',
  'from-purple-500/20',
  'to-violet-600/20',
  '40+ estudos',
  '40+ studies',
  '40+ estudios',
  4,
  TRUE
),
(
  'Saúde Mental',
  'Mental Health',
  'Salud Mental',
  'Conexão com ansiedade, depressão, autoestima e bem-estar psicológico geral',
  'Connection with anxiety, depression, self-esteem and overall psychological well-being',
  'Conexión con ansiedad, depresión, autoestima y bienestar psicológico general',
  'Saúde Mental',
  'Mental Health',
  'Salud Mental',
  'Diamond',
  'text-pink-400',
  'from-pink-500/20',
  'to-rose-600/20',
  '35+ pesquisas',
  '35+ research',
  '35+ investigaciones',
  5,
  TRUE
),
(
  'Estudos Científicos',
  'Scientific Studies',
  'Estudios Científicos',
  'Pesquisas recentes, metanálises e evidências científicas sobre os efeitos da pornografia',
  'Recent research, meta-analyses and scientific evidence on pornography effects',
  'Investigaciones recientes, metanálisis y evidencia científica sobre los efectos de la pornografía',
  'Ciência',
  'Science',
  'Ciencia',
  'ClipboardList',
  'text-yellow-400',
  'from-yellow-500/20',
  'to-amber-600/20',
  '100+ estudos',
  '100+ studies',
  '100+ estudios',
  6,
  TRUE
)
ON CONFLICT DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE public.research_articles IS 'Armazena os artigos de pesquisa sobre os efeitos da pornografia';
COMMENT ON COLUMN public.research_articles.title_pt IS 'Título do artigo em português';
COMMENT ON COLUMN public.research_articles.description_pt IS 'Descrição do artigo em português';
COMMENT ON COLUMN public.research_articles.category_pt IS 'Categoria do artigo em português';
COMMENT ON COLUMN public.research_articles.icon_name IS 'Nome do ícone do lucide-react';
COMMENT ON COLUMN public.research_articles.display_order IS 'Ordem de exibição dos artigos';
COMMENT ON COLUMN public.research_articles.is_active IS 'Se o artigo está ativo e visível para os usuários';

