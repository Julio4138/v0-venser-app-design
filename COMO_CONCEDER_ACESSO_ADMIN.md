# 🔐 Como Conceder Acesso Administrativo

Este documento explica como conceder acesso ao painel administrativo para um usuário específico.

## 📋 Método 1: Via Migration SQL (Recomendado)

Execute a migration `005_grant_admin_access.sql` no Supabase:

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Copie o conteúdo do arquivo `supabase/migrations/005_grant_admin_access.sql`
5. Cole e execute no editor SQL

## 📋 Método 2: Via SQL Editor (Manual)

Se preferir fazer manualmente ou conceder acesso a outro usuário:

```sql
-- Conceder acesso administrativo
UPDATE public.profiles
SET is_pro = TRUE
WHERE email = 'julionavyy@gmail.com';
```

Para verificar se funcionou:

```sql
-- Verificar se o usuário tem acesso admin
SELECT id, email, full_name, is_pro, created_at
FROM public.profiles
WHERE email = 'julionavyy@gmail.com';
```

## 📋 Método 3: Via Painel Admin (Após ter acesso)

Se você já tem acesso ao painel administrativo:

1. Acesse `/admin/users`
2. Encontre o usuário pelo email
3. Clique no botão de escudo (Shield) para conceder privilégios de administrador
4. Ou edite o usuário e marque a opção "Administrador"

## ✅ Verificação

Após conceder o acesso, o usuário poderá:

- Acessar `/admin` e todas as rotas administrativas
- Ver o link "Admin" na sidebar
- Gerenciar usuários, funcionalidades e analytics

## 🔒 Segurança

- Apenas usuários com `is_pro = TRUE` podem acessar o painel admin
- O middleware verifica automaticamente o acesso
- Todas as ações administrativas são logadas em `admin_activity_log`

## 📝 Notas

- O usuário precisa estar cadastrado no sistema antes de conceder acesso
- Se o usuário não existir, a migration mostrará um aviso
- Você pode remover o acesso admin definindo `is_pro = FALSE`

