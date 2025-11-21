-- ============================================
-- VENSER Playlists Table
-- Armazena playlists de podcasts (áudio e vídeo)
-- ============================================

CREATE TABLE IF NOT EXISTS public.playlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name_pt TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_es TEXT NOT NULL,
  description_pt TEXT,
  description_en TEXT,
  description_es TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de relacionamento entre playlists e podcasts
CREATE TABLE IF NOT EXISTS public.playlist_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
  podcast_id UUID REFERENCES public.podcasts(id) ON DELETE CASCADE NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(playlist_id, podcast_id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_playlists_is_active ON public.playlists(is_active);
CREATE INDEX IF NOT EXISTS idx_playlists_display_order ON public.playlists(display_order);
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON public.playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_podcast_id ON public.playlist_items(podcast_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_display_order ON public.playlist_items(display_order);

-- RLS Policies
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler playlists ativas
CREATE POLICY "Anyone can view active playlists"
  ON public.playlists
  FOR SELECT
  USING (is_active = TRUE);

-- Política: Apenas admins podem inserir playlists
CREATE POLICY "Only admins can insert playlists"
  ON public.playlists
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_pro = TRUE
    )
  );

-- Política: Apenas admins podem atualizar playlists
CREATE POLICY "Only admins can update playlists"
  ON public.playlists
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_pro = TRUE
    )
  );

-- Política: Apenas admins podem deletar playlists
CREATE POLICY "Only admins can delete playlists"
  ON public.playlists
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_pro = TRUE
    )
  );

-- Política: Todos podem ler itens de playlists ativas
CREATE POLICY "Anyone can view items of active playlists"
  ON public.playlist_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_items.playlist_id
      AND playlists.is_active = TRUE
    )
  );

-- Política: Apenas admins podem inserir itens de playlist
CREATE POLICY "Only admins can insert playlist items"
  ON public.playlist_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_pro = TRUE
    )
  );

-- Política: Apenas admins podem atualizar itens de playlist
CREATE POLICY "Only admins can update playlist items"
  ON public.playlist_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_pro = TRUE
    )
  );

-- Política: Apenas admins podem deletar itens de playlist
CREATE POLICY "Only admins can delete playlist items"
  ON public.playlist_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_pro = TRUE
    )
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_playlists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_playlists_updated_at
  BEFORE UPDATE ON public.playlists
  FOR EACH ROW
  EXECUTE FUNCTION update_playlists_updated_at();

