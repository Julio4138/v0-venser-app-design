-- ============================================
-- VENSER Admin Features - Controle de Funcionalidades
-- ============================================

-- ============================================
-- 1. FEATURES TABLE
-- Tabela para gerenciar funcionalidades do aplicativo
-- ============================================
CREATE TABLE IF NOT EXISTS public.features (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT TRUE,
  category TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 2. ADMIN_ACTIVITY_LOG TABLE
-- Log de atividades administrativas
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'user_created', 'user_updated', 'user_deleted', 'feature_toggled', 'feature_created', etc.
  entity_type TEXT NOT NULL, -- 'user', 'feature', 'program', etc.
  entity_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_features_category ON public.features(category);
CREATE INDEX IF NOT EXISTS idx_features_is_enabled ON public.features(is_enabled);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON public.admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON public.admin_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action_type ON public.admin_activity_log(action_type);

-- ============================================
-- TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS update_features_updated_at ON public.features;
CREATE TRIGGER update_features_updated_at BEFORE UPDATE ON public.features
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Policies para FEATURES
-- Todos podem ver features habilitadas
DROP POLICY IF EXISTS "Anyone can view enabled features" ON public.features;
CREATE POLICY "Anyone can view enabled features"
  ON public.features FOR SELECT
  USING (is_enabled = TRUE);

-- Admins podem ver todas as features
DROP POLICY IF EXISTS "Admins can view all features" ON public.features;
CREATE POLICY "Admins can view all features"
  ON public.features FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_pro = TRUE
    )
  );

-- Admins podem gerenciar features
DROP POLICY IF EXISTS "Admins can manage features" ON public.features;
CREATE POLICY "Admins can manage features"
  ON public.features FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_pro = TRUE
    )
  );

-- Policies para ADMIN_ACTIVITY_LOG
-- Apenas admins podem ver o log
DROP POLICY IF EXISTS "Admins can view activity log" ON public.admin_activity_log;
CREATE POLICY "Admins can view activity log"
  ON public.admin_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_pro = TRUE
    )
  );

-- Admins podem inserir no log (via trigger ou aplicação)
DROP POLICY IF EXISTS "Admins can insert activity log" ON public.admin_activity_log;
CREATE POLICY "Admins can insert activity log"
  ON public.admin_activity_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_pro = TRUE
    )
  );

-- ============================================
-- FUNCTION: Log admin activity
-- ============================================
CREATE OR REPLACE FUNCTION public.log_admin_activity(
  p_action_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_admin_id UUID;
  v_log_id UUID;
BEGIN
  -- Obter ID do admin atual
  SELECT id INTO v_admin_id
  FROM public.profiles
  WHERE id = auth.uid() AND is_pro = TRUE;

  -- Se não for admin, não loga
  IF v_admin_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Inserir log
  INSERT INTO public.admin_activity_log (
    admin_id,
    action_type,
    entity_type,
    entity_id,
    details
  )
  VALUES (
    v_admin_id,
    p_action_type,
    p_entity_type,
    p_entity_id,
    p_details
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED DATA - Features padrão
-- ============================================
INSERT INTO public.features (name, description, is_enabled, category, config) VALUES
  ('Programa de 90 Dias', 'Habilita o programa completo de 90 dias de recuperação', TRUE, 'Programa', '{}'::jsonb),
  ('Missões Diárias', 'Sistema de missões diárias para ganhar XP', TRUE, 'Gamificação', '{}'::jsonb),
  ('Comunidade', 'Acesso à comunidade e fórum de usuários', TRUE, 'Social', '{}'::jsonb),
  ('Analytics', 'Dashboard de analytics e métricas pessoais', TRUE, 'Analytics', '{}'::jsonb),
  ('Chat com IA', 'Conversas com assistente virtual Melius', TRUE, 'IA', '{}'::jsonb),
  ('Notificações Push', 'Envio de notificações push para dispositivos móveis', FALSE, 'Notificações', '{}'::jsonb)
ON CONFLICT DO NOTHING;

