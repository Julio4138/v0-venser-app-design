-- ============================================
-- DAILY PLANNER TABLE
-- Planner Diário Interativo
-- ============================================

CREATE TABLE IF NOT EXISTS public.daily_planner (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  planner_date DATE NOT NULL DEFAULT CURRENT_DATE,
  daily_goal TEXT,
  tasks JSONB DEFAULT '[]'::jsonb, -- Array de {id, text, completed}
  triggers JSONB DEFAULT '[]'::jsonb, -- Array de {id, text, intensity: 'leve'|'moderado'|'forte'}
  reward TEXT,
  reflection TEXT,
  mood TEXT, -- Emoji do humor
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, planner_date)
);

-- Index para melhor performance
CREATE INDEX IF NOT EXISTS idx_daily_planner_user_id ON public.daily_planner(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_planner_date ON public.daily_planner(planner_date);

-- Habilitar RLS
ALTER TABLE public.daily_planner ENABLE ROW LEVEL SECURITY;

-- Policies para DAILY_PLANNER
CREATE POLICY "Users can view their own planner entries"
  ON public.daily_planner FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own planner entries"
  ON public.daily_planner FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own planner entries"
  ON public.daily_planner FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own planner entries"
  ON public.daily_planner FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_daily_planner_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_planner_updated_at
  BEFORE UPDATE ON public.daily_planner
  FOR EACH ROW
  EXECUTE FUNCTION public.update_daily_planner_updated_at();

