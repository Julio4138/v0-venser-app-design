-- ============================================
-- Migration: Permitir que administradores vejam todos os perfis
-- ============================================
-- Esta migration adiciona uma política RLS que permite que usuários
-- com is_pro = TRUE (administradores) vejam todos os perfis na tabela profiles

-- Policy para permitir que admins vejam todos os perfis
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_pro = TRUE
    )
  );

-- Policy para permitir que admins atualizem todos os perfis
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_pro = TRUE
    )
  );

-- Policy para permitir que admins deletem perfis
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_pro = TRUE
    )
  );

-- Policy para permitir que admins vejam todo o progresso dos usuários
DROP POLICY IF EXISTS "Admins can view all user progress" ON public.user_progress;
CREATE POLICY "Admins can view all user progress"
  ON public.user_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_pro = TRUE
    )
  );

-- Policy para permitir que admins atualizem o progresso dos usuários
DROP POLICY IF EXISTS "Admins can update all user progress" ON public.user_progress;
CREATE POLICY "Admins can update all user progress"
  ON public.user_progress FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_pro = TRUE
    )
  );

