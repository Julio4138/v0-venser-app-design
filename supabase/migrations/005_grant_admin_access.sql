-- ============================================
-- Grant Admin Access to Specific User
-- ============================================

-- Conceder acesso administrativo ao email julionavyy@gmail.com
UPDATE public.profiles
SET is_pro = TRUE
WHERE email = 'julionavyy@gmail.com';

-- Verificar se o usuário foi atualizado
DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
BEGIN
  SELECT id, email INTO v_user_id, v_email
  FROM public.profiles
  WHERE email = 'julionavyy@gmail.com';
  
  IF v_user_id IS NOT NULL THEN
    RAISE NOTICE 'Acesso administrativo concedido para: % (ID: %)', v_email, v_user_id;
  ELSE
    RAISE WARNING 'Usuário com email julionavyy@gmail.com não encontrado. Certifique-se de que o usuário já está cadastrado.';
  END IF;
END $$;

