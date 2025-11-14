-- Adiciona coluna biography na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS biography TEXT;

