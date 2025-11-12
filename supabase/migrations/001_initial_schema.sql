-- ============================================
-- VENSER Database Schema
-- Sistema de Recuperação e Reprogramação Mental
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- Estende a tabela auth.users com informações do perfil
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  is_pro BOOLEAN DEFAULT FALSE,
  start_date DATE DEFAULT CURRENT_DATE,
  language_preference TEXT DEFAULT 'pt' CHECK (language_preference IN ('pt', 'en', 'es'))
);

-- ============================================
-- 2. USER_PROGRESS TABLE
-- Armazena o progresso geral do usuário
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_days_clean INTEGER DEFAULT 0,
  current_day INTEGER DEFAULT 0, -- Dia atual do programa de 90 dias
  total_xp INTEGER DEFAULT 0,
  recovery_score INTEGER DEFAULT 0, -- Score de 0-100
  last_checkin_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 3. DAILY_CHECKINS TABLE
-- Check-ins diários do usuário (humor, energia, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood INTEGER CHECK (mood >= 1 AND mood <= 5), -- 1=struggling, 2=okay, 3=good, 4=excellent
  energy_level INTEGER CHECK (energy_level >= 0 AND energy_level <= 100),
  mental_clarity INTEGER CHECK (mental_clarity >= 0 AND mental_clarity <= 100),
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, checkin_date)
);

-- ============================================
-- 4. PROGRAM_DAYS TABLE
-- Dias do programa de 90 dias
-- ============================================
CREATE TABLE IF NOT EXISTS public.program_days (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 90),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  exercise_content TEXT,
  meditation_url TEXT,
  insight_text TEXT,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, day_number)
);

-- ============================================
-- 5. DAILY_MISSIONS TABLE
-- Missões diárias disponíveis
-- ============================================
CREATE TABLE IF NOT EXISTS public.daily_missions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mission_type TEXT NOT NULL, -- 'breathing', 'reading', 'journaling', 'meditation', 'mood'
  title_pt TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_es TEXT NOT NULL,
  description_pt TEXT,
  description_en TEXT,
  description_es TEXT,
  xp_reward INTEGER DEFAULT 10,
  icon_name TEXT, -- Nome do ícone do lucide-react
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 6. MISSION_COMPLETIONS TABLE
-- Histórico de conclusão de missões
-- ============================================
CREATE TABLE IF NOT EXISTS public.mission_completions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mission_id UUID REFERENCES public.daily_missions(id) ON DELETE CASCADE NOT NULL,
  completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, mission_id, completion_date)
);

-- ============================================
-- 7. MILESTONES TABLE
-- Marcos alcançados pelo usuário
-- ============================================
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  milestone_type TEXT NOT NULL, -- 'first_week', 'two_weeks', 'one_month', 'three_months'
  days_required INTEGER NOT NULL,
  achieved BOOLEAN DEFAULT FALSE,
  achieved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, milestone_type)
);

-- ============================================
-- 8. MOOD_ENTRIES TABLE
-- Entradas de humor para analytics
-- ============================================
CREATE TABLE IF NOT EXISTS public.mood_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood_value INTEGER CHECK (mood_value >= 1 AND mood_value <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, entry_date)
);

-- ============================================
-- 9. PRODUCTIVITY_ENTRIES TABLE
-- Entradas de produtividade para analytics
-- ============================================
CREATE TABLE IF NOT EXISTS public.productivity_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  productivity_score INTEGER CHECK (productivity_score >= 0 AND productivity_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, entry_date)
);

-- ============================================
-- INDEXES para melhor performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_id ON public.daily_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_date ON public.daily_checkins(checkin_date);
CREATE INDEX IF NOT EXISTS idx_program_days_user_id ON public.program_days(user_id);
CREATE INDEX IF NOT EXISTS idx_program_days_day_number ON public.program_days(day_number);
CREATE INDEX IF NOT EXISTS idx_mission_completions_user_id ON public.mission_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_mission_completions_date ON public.mission_completions(completion_date);
CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON public.milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_id ON public.mood_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_entries_date ON public.mood_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_productivity_entries_user_id ON public.productivity_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_productivity_entries_date ON public.productivity_entries(entry_date);

-- ============================================
-- FUNCTIONS E TRIGGERS
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_checkins_updated_at BEFORE UPDATE ON public.daily_checkins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_program_days_updated_at BEFORE UPDATE ON public.program_days
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para criar perfil automaticamente quando um usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Criar registro inicial de progresso
  INSERT INTO public.user_progress (user_id)
  VALUES (NEW.id);
  
  -- Criar dias do programa
  INSERT INTO public.program_days (user_id, day_number)
  SELECT NEW.id, generate_series(1, 90);
  
  -- Criar marcos iniciais
  INSERT INTO public.milestones (user_id, milestone_type, days_required)
  VALUES
    (NEW.id, 'first_week', 7),
    (NEW.id, 'two_weeks', 14),
    (NEW.id, 'one_month', 30),
    (NEW.id, 'three_months', 90);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil quando usuário se registra
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productivity_entries ENABLE ROW LEVEL SECURITY;

-- Policies para PROFILES
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policies para USER_PROGRESS
CREATE POLICY "Users can view their own progress"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.user_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies para DAILY_CHECKINS
CREATE POLICY "Users can view their own checkins"
  ON public.daily_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checkins"
  ON public.daily_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checkins"
  ON public.daily_checkins FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies para PROGRAM_DAYS
CREATE POLICY "Users can view their own program days"
  ON public.program_days FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own program days"
  ON public.program_days FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies para DAILY_MISSIONS (público para leitura)
CREATE POLICY "Anyone can view active missions"
  ON public.daily_missions FOR SELECT
  USING (is_active = TRUE);

-- Policies para MISSION_COMPLETIONS
CREATE POLICY "Users can view their own mission completions"
  ON public.mission_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mission completions"
  ON public.mission_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies para MILESTONES
CREATE POLICY "Users can view their own milestones"
  ON public.milestones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own milestones"
  ON public.milestones FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies para MOOD_ENTRIES
CREATE POLICY "Users can view their own mood entries"
  ON public.mood_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mood entries"
  ON public.mood_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mood entries"
  ON public.mood_entries FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies para PRODUCTIVITY_ENTRIES
CREATE POLICY "Users can view their own productivity entries"
  ON public.productivity_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own productivity entries"
  ON public.productivity_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own productivity entries"
  ON public.productivity_entries FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- SEED DATA - Missões diárias padrão
-- ============================================
INSERT INTO public.daily_missions (mission_type, title_pt, title_en, title_es, description_pt, description_en, description_es, xp_reward, icon_name, is_active)
VALUES
  ('breathing', '3 minutos de respiração', '3 minutes of breathing', '3 minutos de respiración', 'Pratique exercícios de respiração por 3 minutos', 'Practice breathing exercises for 3 minutes', 'Practica ejercicios de respiración por 3 minutos', 10, 'Wind', TRUE),
  ('reading', 'Ler insight do dia', 'Read insight of the day', 'Leer insight del día', 'Leia o insight diário sobre recuperação', 'Read the daily insight about recovery', 'Lee el insight diario sobre recuperación', 15, 'BookOpen', TRUE),
  ('journaling', 'Anotar gatilhos', 'Note your triggers', 'Anotar gatillos', 'Anote os gatilhos que você identificou hoje', 'Note the triggers you identified today', 'Anota los gatillos que identificaste hoy', 20, 'FileText', TRUE),
  ('meditation', 'Meditação guiada', 'Guided meditation', 'Meditación guiada', 'Complete uma sessão de meditação guiada', 'Complete a guided meditation session', 'Completa una sesión de meditación guiada', 25, 'Brain', TRUE),
  ('mood', 'Check-in de humor', 'Mood check-in', 'Check-in de humor', 'Registre como você está se sentindo hoje', 'Register how you are feeling today', 'Registra cómo te sientes hoy', 10, 'Smile', TRUE)
ON CONFLICT DO NOTHING;

