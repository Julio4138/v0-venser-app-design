# 🗄️ Schema do Banco de Dados VENSER

Este diretório contém as migrations SQL para configurar o banco de dados do Supabase.

## 📋 Estrutura das Tabelas

### 1. **profiles**
Armazena informações do perfil do usuário, estendendo `auth.users`.

**Campos principais:**
- `id` - UUID (referência a auth.users)
- `email` - Email do usuário
- `full_name` - Nome completo
- `avatar_url` - URL do avatar
- `is_pro` - Se o usuário tem plano PRO
- `start_date` - Data de início da jornada
- `language_preference` - Idioma preferido (pt, en, es)

### 2. **user_progress**
Armazena o progresso geral do usuário.

**Campos principais:**
- `current_streak` - Sequência atual de dias limpos
- `longest_streak` - Maior sequência alcançada
- `total_days_clean` - Total de dias limpos
- `current_day` - Dia atual do programa (1-90)
- `total_xp` - Experiência total acumulada
- `recovery_score` - Score de recuperação (0-100)

### 3. **daily_checkins**
Check-ins diários do usuário.

**Campos principais:**
- `checkin_date` - Data do check-in
- `mood` - Humor (1-5)
- `energy_level` - Nível de energia (0-100)
- `mental_clarity` - Clareza mental (0-100)
- `notes` - Notas do dia
- `completed` - Se o dia foi completado

### 4. **program_days**
Dias do programa de 90 dias.

**Campos principais:**
- `day_number` - Número do dia (1-90)
- `completed` - Se o dia foi completado
- `exercise_content` - Conteúdo do exercício
- `meditation_url` - URL da meditação
- `insight_text` - Texto do insight
- `xp_earned` - XP ganho no dia

### 5. **daily_missions**
Missões diárias disponíveis.

**Campos principais:**
- `mission_type` - Tipo da missão
- `title_pt/en/es` - Títulos em diferentes idiomas
- `description_pt/en/es` - Descrições em diferentes idiomas
- `xp_reward` - XP de recompensa
- `icon_name` - Nome do ícone (lucide-react)

### 6. **mission_completions**
Histórico de conclusão de missões.

**Campos principais:**
- `mission_id` - ID da missão
- `completion_date` - Data de conclusão
- `xp_earned` - XP ganho

### 7. **milestones**
Marcos alcançados pelo usuário.

**Campos principais:**
- `milestone_type` - Tipo do marco (first_week, two_weeks, etc.)
- `days_required` - Dias necessários
- `achieved` - Se foi alcançado
- `achieved_at` - Data de alcance

### 8. **mood_entries**
Entradas de humor para analytics.

### 9. **productivity_entries**
Entradas de produtividade para analytics.

## 🚀 Como Aplicar as Migrations

### Opção 1: Via Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Copie o conteúdo do arquivo `001_initial_schema.sql`
5. Cole e execute no editor SQL

### Opção 2: Via Supabase CLI

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Fazer login
supabase login

# Linkar ao projeto
supabase link --project-ref seu-project-ref

# Aplicar migrations
supabase db push
```

## 🔒 Segurança

Todas as tabelas têm **Row Level Security (RLS)** habilitado. As políticas garantem que:

- Usuários só podem ver e modificar seus próprios dados
- Missões diárias são públicas para leitura (apenas ativas)
- Dados são isolados por usuário

## 🔄 Triggers Automáticos

### `handle_new_user`
Quando um novo usuário se registra:
- Cria automaticamente um perfil
- Cria registro inicial de progresso
- Cria todos os 90 dias do programa
- Cria os 4 marcos iniciais

### `update_updated_at_column`
Atualiza automaticamente o campo `updated_at` em todas as tabelas quando há uma atualização.

## 📊 Índices

Foram criados índices nas colunas mais consultadas para melhorar a performance:
- `user_id` em todas as tabelas relacionadas
- `date` em tabelas com dados temporais
- `day_number` na tabela de program_days

## 🌱 Seed Data

O arquivo SQL inclui dados iniciais para as missões diárias padrão:
- 3 minutos de respiração
- Ler insight do dia
- Anotar gatilhos
- Meditação guiada
- Check-in de humor

## 📝 Próximos Passos

Após aplicar as migrations:

1. Verifique se todas as tabelas foram criadas
2. Teste a criação de um novo usuário
3. Verifique se o trigger `handle_new_user` está funcionando
4. Teste as políticas RLS fazendo queries como usuário autenticado

## 🐛 Troubleshooting

### Erro: "permission denied"
- Verifique se o RLS está configurado corretamente
- Verifique se o usuário está autenticado
- Verifique se as políticas estão aplicadas

### Erro: "function does not exist"
- Certifique-se de que executou todo o SQL
- Verifique se a extensão `uuid-ossp` está habilitada

### Trigger não funciona
- Verifique se o trigger está criado: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
- Verifique os logs do Supabase para erros

