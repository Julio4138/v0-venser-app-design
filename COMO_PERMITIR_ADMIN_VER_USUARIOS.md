# 🔐 Como Permitir que Administradores Vejam Todos os Usuários

## ⚠️ Problema

As políticas RLS (Row Level Security) atuais só permitem que usuários vejam seus próprios perfis. Isso impede que administradores vejam a lista completa de usuários no painel `/admin/users`.

## ✅ Solução

Execute a migration `014_admin_view_all_profiles.sql` no Supabase para adicionar políticas que permitem que administradores vejam todos os perfis.

## 📋 Passo a Passo

### 1. Acesse o Supabase Dashboard
- Vá para [https://app.supabase.com](https://app.supabase.com)
- Faça login na sua conta
- Selecione o projeto VENSER

### 2. Abra o SQL Editor
- No menu lateral, clique em **SQL Editor**
- Clique em **New query**

### 3. Execute a Migration
1. Abra o arquivo `supabase/migrations/014_admin_view_all_profiles.sql` no seu projeto
2. Copie **TODO** o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)
5. Aguarde a mensagem de sucesso

### 4. Verifique se Funcionou
Após executar a migration, você deve ver uma mensagem de sucesso. As políticas foram criadas e agora administradores podem:

- ✅ Ver todos os perfis (`profiles`)
- ✅ Atualizar todos os perfis
- ✅ Deletar perfis
- ✅ Ver todo o progresso dos usuários (`user_progress`)
- ✅ Atualizar o progresso dos usuários

### 5. Teste no Painel Admin
1. Acesse `/admin/users` no seu aplicativo
2. Você deve ver todos os usuários cadastrados na tabela `profiles`
3. Se ainda não aparecer, verifique:
   - Se você está logado como administrador (`is_pro = TRUE`)
   - Se há usuários cadastrados na tabela `profiles`
   - O console do navegador para erros

## 🔍 Verificar Políticas Criadas

Para verificar se as políticas foram criadas corretamente, execute no SQL Editor:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
```

Você deve ver as seguintes políticas:
- `Admins can view all profiles`
- `Admins can update all profiles`
- `Admins can delete profiles`
- `Users can view their own profile` (já existia)
- `Users can update their own profile` (já existia)

## 🐛 Troubleshooting

### Erro: "policy already exists"
- Isso significa que a política já foi criada anteriormente
- Pode ignorar o erro ou executar `DROP POLICY` antes

### Erro: "permission denied"
- Certifique-se de estar usando o SQL Editor com permissões de administrador
- Verifique se você tem acesso ao projeto

### Usuários ainda não aparecem
1. Verifique se você está logado como administrador:
   ```sql
   SELECT id, email, is_pro FROM profiles WHERE id = auth.uid();
   ```
   O campo `is_pro` deve ser `TRUE`

2. Verifique se há usuários na tabela:
   ```sql
   SELECT COUNT(*) FROM profiles;
   ```

3. Verifique o console do navegador (F12) para erros

## 📝 Notas Importantes

- As políticas RLS são cumulativas (OR logic)
- Um administrador pode ver todos os perfis E seu próprio perfil
- Usuários normais continuam vendo apenas seus próprios perfis
- A segurança é mantida: apenas usuários com `is_pro = TRUE` têm acesso administrativo

