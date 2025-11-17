-- ============================================
-- Migration: Add quitting_reason to profiles
-- ============================================
-- Adiciona a coluna quitting_reason à tabela profiles
-- para armazenar o motivo pelo qual o usuário está parando

-- Adiciona a coluna se ela não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'quitting_reason'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN quitting_reason TEXT;
    
    -- Adiciona comentário na coluna
    COMMENT ON COLUMN public.profiles.quitting_reason IS 'Motivo pelo qual o usuário está parando (adicional pelo usuário)';
  END IF;
END $$;




