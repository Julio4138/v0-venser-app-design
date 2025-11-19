-- ============================================
-- COMMUNITY MANAGEMENT
-- Sistema de gerenciamento e moderação da comunidade
-- ============================================

-- Tabela para banimentos e restrições de usuários na comunidade
CREATE TABLE IF NOT EXISTS public.community_restrictions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  restriction_type TEXT NOT NULL CHECK (restriction_type IN ('ban', 'temporary_restriction', 'warning')),
  reason TEXT,
  restricted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE, -- NULL para banimento permanente
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_community_restrictions_user_id ON public.community_restrictions(user_id);
CREATE INDEX IF NOT EXISTS idx_community_restrictions_is_active ON public.community_restrictions(is_active);
CREATE INDEX IF NOT EXISTS idx_community_restrictions_ends_at ON public.community_restrictions(ends_at);

-- Adicionar campo is_anonymous se não existir (já deve existir, mas garantindo)
ALTER TABLE public.community_posts 
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;

-- Adicionar campo para marcação de posts removidos
ALTER TABLE public.community_posts 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Adicionar campo para marcação de posts removidos em comentários
ALTER TABLE public.post_comments 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Habilitar RLS
ALTER TABLE public.community_restrictions ENABLE ROW LEVEL SECURITY;

-- Policies para COMMUNITY_RESTRICTIONS
-- Apenas admins podem ver todas as restrições
CREATE POLICY "Admins can view all community restrictions"
  ON public.community_restrictions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_pro = TRUE
    )
  );

-- Usuários podem ver suas próprias restrições
CREATE POLICY "Users can view their own restrictions"
  ON public.community_restrictions FOR SELECT
  USING (auth.uid() = user_id);

-- Apenas admins podem criar restrições
CREATE POLICY "Admins can create community restrictions"
  ON public.community_restrictions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_pro = TRUE
    )
  );

-- Apenas admins podem atualizar restrições
CREATE POLICY "Admins can update community restrictions"
  ON public.community_restrictions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_pro = TRUE
    )
  );

-- Apenas admins podem deletar restrições
CREATE POLICY "Admins can delete community restrictions"
  ON public.community_restrictions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_pro = TRUE
    )
  );

-- Policy para admins poderem deletar posts
CREATE POLICY "Admins can delete any post"
  ON public.community_posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_pro = TRUE
    )
  );

-- Policy para admins poderem deletar comentários
CREATE POLICY "Admins can delete any comment"
  ON public.post_comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_pro = TRUE
    )
  );

-- Função para verificar se usuário está banido ou restrito
CREATE OR REPLACE FUNCTION public.is_user_community_restricted(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_active_restriction BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM public.community_restrictions
    WHERE user_id = p_user_id
      AND is_active = TRUE
      AND (
        restriction_type = 'ban'
        OR (restriction_type = 'temporary_restriction' AND ends_at > NOW())
      )
  ) INTO v_has_active_restriction;
  
  RETURN v_has_active_restriction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

