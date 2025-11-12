# 🛡️ Migrations do Painel Administrativo

Este documento descreve as migrations necessárias para o painel administrativo do VENSER.

## 📋 Migration 003: Admin Features

**Arquivo:** `003_admin_features.sql`

### Tabelas Criadas

#### 1. `features`
Tabela para gerenciar funcionalidades do aplicativo.

**Campos:**
- `id` (UUID) - Identificador único
- `name` (TEXT) - Nome da funcionalidade
- `description` (TEXT) - Descrição da funcionalidade
- `is_enabled` (BOOLEAN) - Se a funcionalidade está habilitada
- `category` (TEXT) - Categoria (Programa, Gamificação, Social, etc.)
- `config` (JSONB) - Configurações adicionais em formato JSON
- `created_at` (TIMESTAMP) - Data de criação
- `updated_at` (TIMESTAMP) - Data de atualização

**Políticas RLS:**
- Usuários podem ver apenas features habilitadas
- Administradores podem ver e gerenciar todas as features

#### 2. `admin_activity_log`
Log de atividades administrativas para auditoria.

**Campos:**
- `id` (UUID) - Identificador único
- `admin_id` (UUID) - ID do administrador que executou a ação
- `action_type` (TEXT) - Tipo de ação (user_created, feature_toggled, etc.)
- `entity_type` (TEXT) - Tipo de entidade (user, feature, program, etc.)
- `entity_id` (UUID) - ID da entidade afetada
- `details` (JSONB) - Detalhes adicionais da ação
- `ip_address` (TEXT) - Endereço IP (opcional)
- `user_agent` (TEXT) - User agent (opcional)
- `created_at` (TIMESTAMP) - Data da ação

**Políticas RLS:**
- Apenas administradores podem ver e inserir logs

### Funções Criadas

#### `log_admin_activity`
Função para registrar atividades administrativas.

**Parâmetros:**
- `p_action_type` (TEXT) - Tipo de ação
- `p_entity_type` (TEXT) - Tipo de entidade
- `p_entity_id` (UUID) - ID da entidade (opcional)
- `p_details` (JSONB) - Detalhes da ação (opcional)

**Retorna:** UUID do log criado

### Seed Data

A migration inclui dados iniciais para as seguintes funcionalidades:
- Programa de 90 Dias (habilitado)
- Missões Diárias (habilitado)
- Comunidade (habilitado)
- Analytics (habilitado)
- Chat com IA (habilitado)
- Notificações Push (desabilitado)

## 🚀 Como Aplicar

### Opção 1: Via Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Copie o conteúdo do arquivo `003_admin_features.sql`
5. Cole e execute no editor SQL

### Opção 2: Via Supabase CLI

```bash
# Aplicar todas as migrations
supabase db push

# Ou aplicar apenas esta migration
supabase migration up
```

## 🔒 Segurança

- Todas as tabelas têm **Row Level Security (RLS)** habilitado
- Apenas administradores (`is_pro = TRUE`) podem gerenciar features
- Logs de atividade são protegidos e apenas visíveis para administradores
- Funções usam `SECURITY DEFINER` para garantir permissões adequadas

## 📊 Índices Criados

Para melhorar a performance:
- `idx_features_category` - Índice na coluna `category` da tabela `features`
- `idx_features_is_enabled` - Índice na coluna `is_enabled` da tabela `features`
- `idx_admin_activity_log_admin_id` - Índice na coluna `admin_id` do log
- `idx_admin_activity_log_created_at` - Índice na coluna `created_at` do log
- `idx_admin_activity_log_action_type` - Índice na coluna `action_type` do log

## 🔄 Triggers

- `update_features_updated_at` - Atualiza automaticamente `updated_at` na tabela `features`

## 📝 Tipos de Ações Registradas

O log de atividades registra os seguintes tipos de ações:

### Usuários
- `user_created` - Usuário criado
- `user_updated` - Usuário atualizado
- `user_deleted` - Usuário deletado
- `admin_granted` - Privilégios de admin concedidos
- `admin_removed` - Privilégios de admin removidos

### Funcionalidades
- `feature_created` - Funcionalidade criada
- `feature_updated` - Funcionalidade atualizada
- `feature_deleted` - Funcionalidade deletada
- `feature_toggled` - Funcionalidade habilitada/desabilitada

## ⚠️ Notas Importantes

1. **Aplicar em ordem:** Certifique-se de aplicar as migrations na ordem:
   - `001_initial_schema.sql`
   - `002_program_structure.sql`
   - `003_admin_features.sql`

2. **Permissões:** Após aplicar a migration, você precisará tornar pelo menos um usuário administrador:
   ```sql
   UPDATE public.profiles 
   SET is_pro = TRUE 
   WHERE email = 'seu-email@exemplo.com';
   ```

3. **Logs de Atividade:** Os logs são criados automaticamente quando ações administrativas são executadas através do painel.

