-- ============================================
-- AI Agent Configuration - Tony
-- Sistema de gerenciamento do agente IA
-- ============================================

-- ============================================
-- 1. AI_AGENT_CONFIG TABLE
-- Configurações gerais do agente IA
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_agent_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agent_name TEXT DEFAULT 'Tony' NOT NULL,
  system_prompt TEXT NOT NULL,
  personality_traits JSONB DEFAULT '{}'::jsonb,
  behavior_rules JSONB DEFAULT '[]'::jsonb,
  temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER DEFAULT 2000,
  model_name TEXT DEFAULT 'gpt-4',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- ============================================
-- 2. AI_AGENT_KNOWLEDGE_BASE TABLE
-- Base de conhecimento do agente (textos, documentos)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_agent_knowledge_base (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'document', 'faq', 'guideline')),
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  category TEXT,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- ============================================
-- 3. AI_AGENT_CONVERSATIONS TABLE
-- Histórico de conversas para análise e melhoria
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_agent_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT NOT NULL,
  user_message TEXT NOT NULL,
  agent_response TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ai_agent_knowledge_base_category ON public.ai_agent_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_ai_agent_knowledge_base_is_active ON public.ai_agent_knowledge_base(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_agent_conversations_user_id ON public.ai_agent_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_conversations_session_id ON public.ai_agent_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_conversations_created_at ON public.ai_agent_conversations(created_at);

-- ============================================
-- TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS update_ai_agent_config_updated_at ON public.ai_agent_config;
CREATE TRIGGER update_ai_agent_config_updated_at BEFORE UPDATE ON public.ai_agent_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_agent_knowledge_base_updated_at ON public.ai_agent_knowledge_base;
CREATE TRIGGER update_ai_agent_knowledge_base_updated_at BEFORE UPDATE ON public.ai_agent_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.ai_agent_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_conversations ENABLE ROW LEVEL SECURITY;

-- Policies para AI_AGENT_CONFIG
-- Apenas admins podem ver e gerenciar
DROP POLICY IF EXISTS "Admins can view AI agent config" ON public.ai_agent_config;
CREATE POLICY "Admins can view AI agent config"
  ON public.ai_agent_config FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_pro = TRUE
    )
  );

DROP POLICY IF EXISTS "Admins can manage AI agent config" ON public.ai_agent_config;
CREATE POLICY "Admins can manage AI agent config"
  ON public.ai_agent_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_pro = TRUE
    )
  );

-- Policies para AI_AGENT_KNOWLEDGE_BASE
-- Admins podem gerenciar, usuários podem ler apenas itens ativos
DROP POLICY IF EXISTS "Anyone can view active knowledge base" ON public.ai_agent_knowledge_base;
CREATE POLICY "Anyone can view active knowledge base"
  ON public.ai_agent_knowledge_base FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can view all knowledge base" ON public.ai_agent_knowledge_base;
CREATE POLICY "Admins can view all knowledge base"
  ON public.ai_agent_knowledge_base FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_pro = TRUE
    )
  );

DROP POLICY IF EXISTS "Admins can manage knowledge base" ON public.ai_agent_knowledge_base;
CREATE POLICY "Admins can manage knowledge base"
  ON public.ai_agent_knowledge_base FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_pro = TRUE
    )
  );

-- Policies para AI_AGENT_CONVERSATIONS
-- Usuários podem ver suas próprias conversas
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.ai_agent_conversations;
CREATE POLICY "Users can view their own conversations"
  ON public.ai_agent_conversations FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem inserir suas próprias conversas
DROP POLICY IF EXISTS "Users can insert their own conversations" ON public.ai_agent_conversations;
CREATE POLICY "Users can insert their own conversations"
  ON public.ai_agent_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins podem ver todas as conversas
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.ai_agent_conversations;
CREATE POLICY "Admins can view all conversations"
  ON public.ai_agent_conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_pro = TRUE
    )
  );

-- ============================================
-- SEED DATA - Configuração inicial do Tony
-- ============================================
INSERT INTO public.ai_agent_config (
  agent_name,
  system_prompt,
  personality_traits,
  behavior_rules,
  temperature,
  max_tokens,
  model_name
) VALUES (
  'Tony',
  'Você é Tony, um assistente virtual especializado em ajudar pessoas em sua jornada de recuperação e transformação pessoal. Você é empático, compreensivo, motivador e sempre focado no bem-estar do usuário. Use uma linguagem acolhedora e profissional, oferecendo suporte prático e emocional.',
  '{
    "empathy": 9,
    "patience": 10,
    "motivation": 9,
    "professionalism": 8,
    "warmth": 9
  }'::jsonb,
  '[
    "Sempre seja respeitoso e não julgador",
    "Ofereça suporte prático e emocional",
    "Celebre pequenas vitórias do usuário",
    "Seja honesto mas gentil",
    "Foque em soluções e crescimento pessoal"
  ]'::jsonb,
  0.7,
  2000,
  'gpt-4'
)
ON CONFLICT DO NOTHING;

