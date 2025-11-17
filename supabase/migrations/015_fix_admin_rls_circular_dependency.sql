-- ============================================
-- Migration: Corrigir dependência circular nas políticas RLS de admin
-- ============================================
-- O problema: A política "Admins can view all profiles" tenta consultar
-- a tabela profiles para verificar se o usuário é admin, mas isso cria
-- uma dependência circular que impede o acesso.

-- Solução: Usar uma função SECURITY DEFINER que pode acessar a tabela
-- sem passar pelas políticas RLS, ou verificar diretamente via auth.uid()

-- Criar função auxiliar para verificar se usuário é admin
-- Esta função usa SECURITY DEFINER para ignorar RLS
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND is_pro = TRUE
  );
END;
$$;

-- Recriar políticas de admin usando a função auxiliar
-- Isso evita a dependência circular

-- Remover políticas antigas de admin
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Criar novas políticas usando a função is_admin
-- Estas políticas permitem que admins vejam todos os perfis
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id OR -- Usuário pode ver seu próprio perfil
    public.is_admin(auth.uid()) -- OU é admin e pode ver todos
  );

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id OR -- Usuário pode atualizar seu próprio perfil
    public.is_admin(auth.uid()) -- OU é admin e pode atualizar todos
  );

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (
    public.is_admin(auth.uid()) -- Apenas admins podem deletar
  );

-- Fazer o mesmo para user_progress
DROP POLICY IF EXISTS "Admins can view all user progress" ON public.user_progress;
DROP POLICY IF EXISTS "Admins can update all user progress" ON public.user_progress;

CREATE POLICY "Admins can view all user progress"
  ON public.user_progress FOR SELECT
  USING (
    auth.uid() = user_id OR -- Usuário pode ver seu próprio progresso
    public.is_admin(auth.uid()) -- OU é admin e pode ver todos
  );

CREATE POLICY "Admins can update all user progress"
  ON public.user_progress FOR UPDATE
  USING (
    auth.uid() = user_id OR -- Usuário pode atualizar seu próprio progresso
    public.is_admin(auth.uid()) -- OU é admin e pode atualizar todos
  );

-- Garantir que a política original "Users can view their own profile" ainda existe
-- (ela deve existir, mas vamos garantir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile"
      ON public.profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;
END $$;

-- Garantir que a política "Users can update their own profile" existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END $$;

