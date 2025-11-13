-- ============================================
-- Illusion Buster Progress Table
-- Armazena o progresso do jogo Illusion Buster
-- ============================================

-- Tabela para armazenar progresso do Illusion Buster
CREATE TABLE IF NOT EXISTS public.illusion_buster_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  illusion_buster_xp INTEGER DEFAULT 0,
  illusion_buster_level INTEGER DEFAULT 1,
  destroyed_illusions JSONB DEFAULT '[]'::jsonb, -- Array de IDs das ilusões destruídas
  earned_badges JSONB DEFAULT '[]'::jsonb, -- Array de IDs dos badges ganhos
  current_combo INTEGER DEFAULT 0,
  highest_combo INTEGER DEFAULT 0,
  illusion_buster_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_illusion_buster_progress_user_id 
  ON public.illusion_buster_progress(user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_illusion_buster_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_illusion_buster_progress_updated_at ON public.illusion_buster_progress;
CREATE TRIGGER update_illusion_buster_progress_updated_at
  BEFORE UPDATE ON public.illusion_buster_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_illusion_buster_progress_updated_at();

-- Habilitar RLS
ALTER TABLE public.illusion_buster_progress ENABLE ROW LEVEL SECURITY;

-- Policies para Illusion Buster Progress
-- Usuários podem ver seu próprio progresso
CREATE POLICY "Users can view their own illusion buster progress"
  ON public.illusion_buster_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem inserir seu próprio progresso
CREATE POLICY "Users can insert their own illusion buster progress"
  ON public.illusion_buster_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seu próprio progresso
CREATE POLICY "Users can update their own illusion buster progress"
  ON public.illusion_buster_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Função para criar registro inicial quando usuário é criado
-- (opcional - pode ser feito no frontend também)
CREATE OR REPLACE FUNCTION public.create_illusion_buster_progress()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.illusion_buster_progress (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar progresso do Illusion Buster quando perfil é criado
-- (comentado porque pode ser feito no frontend quando necessário)
-- DROP TRIGGER IF EXISTS create_illusion_buster_progress_on_profile ON public.profiles;
-- CREATE TRIGGER create_illusion_buster_progress_on_profile
--   AFTER INSERT ON public.profiles
--   FOR EACH ROW
--   EXECUTE FUNCTION public.create_illusion_buster_progress();

-- Comentários para documentação
COMMENT ON TABLE public.illusion_buster_progress IS 'Armazena o progresso do jogo Illusion Buster para cada usuário';
COMMENT ON COLUMN public.illusion_buster_progress.illusion_buster_xp IS 'XP total ganho no Illusion Buster';
COMMENT ON COLUMN public.illusion_buster_progress.illusion_buster_level IS 'Nível atual no Illusion Buster';
COMMENT ON COLUMN public.illusion_buster_progress.destroyed_illusions IS 'Array JSON com IDs das ilusões destruídas';
COMMENT ON COLUMN public.illusion_buster_progress.earned_badges IS 'Array JSON com IDs dos badges ganhos';
COMMENT ON COLUMN public.illusion_buster_progress.current_combo IS 'Combo atual (reseta após inatividade)';
COMMENT ON COLUMN public.illusion_buster_progress.highest_combo IS 'Maior combo já alcançado';
COMMENT ON COLUMN public.illusion_buster_progress.illusion_buster_streak IS 'Streak atual do Illusion Buster';

