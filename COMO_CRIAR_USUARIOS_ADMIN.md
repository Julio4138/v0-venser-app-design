# 👥 Como Criar Usuários pelo Painel Admin

Este documento explica como usar a funcionalidade de criação de usuários no painel administrativo.

## 📋 Pré-requisitos

### 1. Configurar Service Role Key

Para criar usuários, você precisa configurar a variável de ambiente `SUPABASE_SERVICE_ROLE_KEY`:

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Settings** > **API**
3. Copie a **service_role key** (⚠️ **NUNCA** exponha esta chave no cliente!)
4. Adicione no arquivo `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

**Para produção (Vercel):**
1. Acesse o [Dashboard do Vercel](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** > **Environment Variables**
4. Adicione:
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: `sua-service-role-key-aqui`
   - **Environment**: Production, Preview, Development
5. Clique em **Save**

⚠️ **IMPORTANTE**: A service role key tem acesso total ao banco de dados. Mantenha-a segura e nunca a exponha no código do cliente!

## 🚀 Como Usar

### 1. Acessar o Painel Admin

1. Faça login como administrador
2. Acesse `/admin/users`
3. Clique no botão **"Criar Usuário"** no canto superior direito

### 2. Preencher o Formulário

O formulário inclui os seguintes campos:

- **Email** * (obrigatório)
  - Email do novo usuário
  - Deve ser um email válido e único

- **Senha** * (obrigatório)
  - Senha inicial do usuário
  - Mínimo de 6 caracteres
  - O usuário pode alterar depois

- **Nome Completo** (opcional)
  - Nome completo do usuário

- **Idioma** (opcional)
  - Português (padrão)
  - English
  - Español

- **Data de Início** (opcional)
  - Data de início da jornada do usuário
  - Se deixado em branco, usa a data atual

- **Conceder privilégios de administrador** (checkbox)
  - Marque para dar acesso ao painel admin
  - Desmarque para criar usuário comum

### 3. Criar o Usuário

1. Preencha os campos obrigatórios (Email e Senha)
2. Configure as permissões e preferências desejadas
3. Clique em **"Criar Usuário"**
4. O usuário será criado e aparecerá na lista

## ✅ O que acontece ao criar um usuário?

Quando você cria um novo usuário, o sistema:

1. **Cria a conta no Supabase Auth**
   - Email confirmado automaticamente
   - Senha definida
   - Usuário pode fazer login imediatamente

2. **Cria o perfil na tabela `profiles`**
   - Com todas as informações fornecidas
   - Permissões de admin (se marcado)
   - Idioma preferido
   - Data de início

3. **Cria registros relacionados automaticamente** (via trigger do banco):
   - Registro inicial em `user_progress`
   - 90 dias do programa em `program_days`
   - Marcos iniciais em `milestones`

4. **Registra a atividade no log admin**
   - Ação: `user_created`
   - Detalhes do usuário criado

## 🔒 Segurança

- Apenas administradores podem criar usuários
- A verificação de admin é feita tanto no cliente quanto na API
- Todas as ações são registradas no log de atividades admin
- A service role key nunca é exposta no cliente

## 📝 Notas

- O email deve ser único (não pode já existir no sistema)
- A senha pode ser alterada pelo usuário após o primeiro login
- Usuários criados têm acesso imediato ao sistema
- O trigger do banco cria automaticamente os registros relacionados

## 🐛 Solução de Problemas

### Erro: "Configuração do servidor incompleta"
- Verifique se `SUPABASE_SERVICE_ROLE_KEY` está configurada no `.env.local` ou no Vercel

### Erro: "Acesso negado. Apenas administradores podem criar usuários"
- Verifique se você está logado como administrador
- Verifique se `is_pro = TRUE` no seu perfil

### Erro: "Email já existe"
- O email já está cadastrado no sistema
- Use um email diferente ou edite o usuário existente

### Erro: "A senha deve ter pelo menos 6 caracteres"
- A senha deve ter no mínimo 6 caracteres
- Use uma senha mais longa

