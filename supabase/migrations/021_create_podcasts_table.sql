-- ============================================
-- VENSER Podcasts Table
-- Armazena áudios e vídeos de podcasts
-- ============================================

CREATE TABLE IF NOT EXISTS public.podcasts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title_pt TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_es TEXT NOT NULL,
  description_pt TEXT,
  description_en TEXT,
  description_es TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('audio', 'video')),
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER, -- Duração em segundos
  category_pt TEXT,
  category_en TEXT,
  category_es TEXT,
  author_pt TEXT,
  author_en TEXT,
  author_es TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_podcasts_media_type ON public.podcasts(media_type);
CREATE INDEX IF NOT EXISTS idx_podcasts_is_active ON public.podcasts(is_active);
CREATE INDEX IF NOT EXISTS idx_podcasts_display_order ON public.podcasts(display_order);

-- RLS Policies
ALTER TABLE public.podcasts ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler podcasts ativos
CREATE POLICY "Anyone can view active podcasts"
  ON public.podcasts
  FOR SELECT
  USING (is_active = TRUE);

-- Política: Apenas admins podem inserir
CREATE POLICY "Only admins can insert podcasts"
  ON public.podcasts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_pro = TRUE
    )
  );

-- Política: Apenas admins podem atualizar
CREATE POLICY "Only admins can update podcasts"
  ON public.podcasts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_pro = TRUE
    )
  );

-- Política: Apenas admins podem deletar
CREATE POLICY "Only admins can delete podcasts"
  ON public.podcasts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_pro = TRUE
    )
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_podcasts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_podcasts_updated_at
  BEFORE UPDATE ON public.podcasts
  FOR EACH ROW
  EXECUTE FUNCTION update_podcasts_updated_at();

