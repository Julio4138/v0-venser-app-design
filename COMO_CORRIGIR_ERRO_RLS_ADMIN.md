# 🔧 Como Corrigir Erro RLS para Administradores

## ⚠️ Problema

Erro `{}` ao tentar acessar perfil ou painel admin. Isso acontece porque as políticas RLS (Row Level Security) de administrador criam uma **dependência circular**:

1. Para verificar se o usuário é admin, a política precisa consultar a tabela `profiles`
2. Mas para consultar `profiles`, precisa passar pela política RLS
3. Isso cria um loop que impede o acesso

## ✅ Solução

Execute a migration `015_fix_admin_rls_circular_dependency.sql` no Supabase.

## 📋 Passo a Passo

### 1. Acesse o Supabase Dashboard
- Vá para [https://app.supabase.com](https://app.supabase.com)
- Faça login na sua conta
- Selecione o projeto VENSER

### 2. Abra o SQL Editor
- No menu lateral, clique em **SQL Editor**
- Clique em **New query**

### 3. Execute a Migration
1. Abra o arquivo `supabase/migrations/015_fix_admin_rls_circular_dependency.sql` no seu projeto
2. Copie **TODO** o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)
5. Aguarde a mensagem de sucesso

### 4. O que a Migration Faz

A migration:
- ✅ Cria uma função `is_admin()` que usa `SECURITY DEFINER` para ignorar RLS
- ✅ Recria as políticas de admin usando essa função (evita dependência circular)
- ✅ Garante que usuários possam ver seus próprios perfis
- ✅ Garante que admins possam ver todos os perfis
- ✅ Corrige políticas para `user_progress` também

### 5. Verifique se Funcionou

Após executar a migration:

1. **Teste a página de perfil:**
   - Acesse `/profile` no seu aplicativo
   - Deve carregar sem erros

2. **Teste o painel admin:**
   - Acesse `/admin/users` no seu aplicativo
   - Deve mostrar a lista de usuários

3. **Verifique no console:**
   - Abra o console do navegador (F12)
   - Não deve aparecer erros relacionados a RLS

## 🔍 Verificar Função Criada

Para verificar se a função foi criada corretamente, execute no SQL Editor:

```sql
SELECT 
  proname as function_name,
  prosecdef as security_definer
FROM pg_proc
WHERE proname = 'is_admin';
```

Deve retornar:
- `function_name`: `is_admin`
- `security_definer`: `true`

## 🔍 Verificar Políticas

Para verificar as políticas da tabela `profiles`, execute:

```sql
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
```

Você deve ver:
- `Admins can view all profiles`
- `Admins can update all profiles`
- `Admins can delete profiles`
- `Users can view their own profile`
- `Users can update their own profile`

## 🐛 Troubleshooting

### Erro: "function already exists"
- Isso significa que a função já foi criada
- Pode ignorar ou executar `DROP FUNCTION IF EXISTS public.is_admin(UUID);` antes

### Erro: "policy already exists"
- A migration usa `DROP POLICY IF EXISTS`, então deve funcionar
- Se persistir, execute manualmente: `DROP POLICY IF EXISTS "nome_da_policy" ON public.profiles;`

### Ainda não funciona após a migration
1. Verifique se você está logado como administrador:
   ```sql
   SELECT id, email, is_pro FROM profiles WHERE id = auth.uid();
   ```
   O campo `is_pro` deve ser `TRUE`

2. Verifique se a função está funcionando:
   ```sql
   SELECT public.is_admin(auth.uid());
   ```
   Deve retornar `true` se você for admin

3. Limpe o cache do navegador e faça logout/login novamente

## 📝 Notas Importantes

- A função `is_admin()` usa `SECURITY DEFINER`, o que significa que ela executa com privilégios elevados
- Isso é seguro porque a função apenas verifica se `is_pro = TRUE`
- As políticas RLS agora usam `OR` logic: usuário pode ver seu próprio perfil OU é admin
- Isso resolve a dependência circular

