-- ============================================
-- ANONYMOUS POSTS AND MEDALS SYSTEM
-- Sistema de posts anônimos e medalhas
-- ============================================

-- Adicionar campo is_anonymous em community_posts
ALTER TABLE public.community_posts
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;

-- Adicionar campo is_anonymous em post_comments
ALTER TABLE public.post_comments
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;

-- Criar tabela de medalhas
CREATE TABLE IF NOT EXISTS public.user_medals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  medal_type TEXT NOT NULL, -- 'anonymous_supporter_100', etc.
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, medal_type)
);

-- Criar tabela para contar suportes anônimos recebidos
CREATE TABLE IF NOT EXISTS public.anonymous_support_count (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  total_supports INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_medals_user_id ON public.user_medals(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_is_anonymous ON public.community_posts(is_anonymous);

-- Função para atualizar contador de suportes anônimos
CREATE OR REPLACE FUNCTION update_anonymous_support_count()
RETURNS TRIGGER AS $$
DECLARE
  post_user_id UUID;
BEGIN
  -- Obter user_id do post
  SELECT user_id INTO post_user_id
  FROM public.community_posts
  WHERE id = NEW.post_id AND is_anonymous = TRUE;
  
  -- Se o post é anônimo, atualizar contador
  IF post_user_id IS NOT NULL THEN
    INSERT INTO public.anonymous_support_count (user_id, total_supports, updated_at)
    VALUES (post_user_id, 1, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      total_supports = anonymous_support_count.total_supports + 1,
      updated_at = NOW();
    
    -- Verificar se atingiu 100 suportes e conceder medalha
    INSERT INTO public.user_medals (user_id, medal_type)
    SELECT post_user_id, 'anonymous_supporter_100'
    WHERE (
      SELECT total_supports 
      FROM public.anonymous_support_count 
      WHERE user_id = post_user_id
    ) >= 100
    ON CONFLICT (user_id, medal_type) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para remover suporte anônimo (quando descurtir)
CREATE OR REPLACE FUNCTION remove_anonymous_support_count()
RETURNS TRIGGER AS $$
DECLARE
  post_user_id UUID;
BEGIN
  -- Obter user_id do post
  SELECT user_id INTO post_user_id
  FROM public.community_posts
  WHERE id = OLD.post_id AND is_anonymous = TRUE;
  
  -- Se o post é anônimo, decrementar contador
  IF post_user_id IS NOT NULL THEN
    UPDATE public.anonymous_support_count
    SET 
      total_supports = GREATEST(total_supports - 1, 0),
      updated_at = NOW()
    WHERE user_id = post_user_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar contador de suportes
DROP TRIGGER IF EXISTS update_anonymous_support_on_like ON public.post_likes;
CREATE TRIGGER update_anonymous_support_on_like
  AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION update_anonymous_support_count();

DROP TRIGGER IF EXISTS remove_anonymous_support_on_unlike ON public.post_likes;
CREATE TRIGGER remove_anonymous_support_on_unlike
  AFTER DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION remove_anonymous_support_count();

-- Habilitar RLS
ALTER TABLE public.user_medals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_support_count ENABLE ROW LEVEL SECURITY;

-- Policies para USER_MEDALS
-- Todos podem ver medalhas (público)
CREATE POLICY "Anyone can view medals"
  ON public.user_medals FOR SELECT
  USING (true);

-- Policies para ANONYMOUS_SUPPORT_COUNT
-- Usuários podem ver apenas seu próprio contador
CREATE POLICY "Users can view their own support count"
  ON public.anonymous_support_count FOR SELECT
  USING (auth.uid() = user_id);

-- Atualizar policies existentes para permitir posts anônimos
-- A policy já permite que usuários criem posts, então posts anônimos já funcionam

