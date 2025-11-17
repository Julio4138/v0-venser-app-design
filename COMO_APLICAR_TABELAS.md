# 📊 Como Aplicar as Tabelas no Supabase

## Passo a Passo Rápido

### 1. Acesse o Supabase Dashboard
- Vá para [https://app.supabase.com](https://app.supabase.com)
- Faça login na sua conta
- Selecione o projeto VENSER (ou crie um novo)

### 2. Abra o SQL Editor
- No menu lateral, clique em **SQL Editor**
- Clique em **New query**

### 3. Aplique TODAS as Migrações em Ordem
Execute as migrações na ordem numérica:

1. **001_initial_schema.sql** - Schema inicial (tabelas básicas)
2. **002_program_structure.sql** - Estrutura do programa
3. **003_admin_features.sql** - Recursos de admin
4. **004_fix_complete_program_day.sql** - Correções
5. **005_grant_admin_access.sql** - Acesso admin
6. **006_create_90_days_templates.sql** - Templates de 90 dias
7. **007_create_default_tasks.sql** - Tarefas padrão
8. **008_ai_agent_config.sql** - Configuração do agente IA
9. **008_tony_ai_agent.sql** - Agente Tony
10. **009_create_storage_bucket.sql** - Storage para avatares
11. **009_update_complete_program_day_next_day.sql** - Atualizações
12. **010_add_quitting_reason.sql** - Motivo de desistência
13. **010_daily_planner.sql** - Planejador diário
14. **011_illusion_buster_progress.sql** - ⚠️ **IMPORTANTE**: Tabela do Illusion Buster
15. **012_add_biography_to_profiles.sql** - Biografia nos perfis

**Para cada migração:**
- Abra o arquivo em `supabase/migrations/`
- Copie **TODO** o conteúdo
- Cole no SQL Editor do Supabase
- Clique em **Run** (ou Ctrl+Enter)
- Aguarde a execução completar antes de passar para a próxima

### 5. Verifique se Funcionou
- Vá em **Table Editor** no menu lateral
- Você deve ver as seguintes tabelas criadas:
  - ✅ `profiles`
  - ✅ `user_progress`
  - ✅ `daily_checkins`
  - ✅ `program_days`
  - ✅ `daily_missions`
  - ✅ `mission_completions`
  - ✅ `milestones`
  - ✅ `mood_entries`
  - ✅ `productivity_entries`
  - ✅ `illusion_buster_progress` ⚠️ **Essencial para o Illusion Buster funcionar!**

### 6. Verifique os Dados Iniciais
- Na tabela `daily_missions`, você deve ver 5 missões pré-cadastradas
- Essas são as missões padrão do sistema

## ✅ Pronto!

Agora seu banco de dados está configurado e pronto para uso. Quando um novo usuário se cadastrar:

1. Um perfil será criado automaticamente
2. Um registro de progresso será inicializado
3. Os 90 dias do programa serão criados
4. Os 4 marcos serão configurados

## 🔍 Testando

Para testar se está funcionando:

1. Crie uma conta de teste no seu app
2. Verifique no Supabase se:
   - Um registro foi criado em `profiles`
   - Um registro foi criado em `user_progress`
   - 90 registros foram criados em `program_days`
   - 4 registros foram criados em `milestones`

## ⚠️ Problemas Comuns

### Erro ao executar SQL
- Certifique-se de copiar **TODO** o conteúdo do arquivo
- Verifique se não há erros de sintaxe
- Veja os logs de erro no Supabase

### Tabelas não aparecem
- Recarregue a página do Table Editor
- Verifique se o SQL foi executado com sucesso

### Trigger não funciona
- O trigger é criado automaticamente pelo SQL
- Se não funcionar, verifique os logs do Supabase

### Erro "Error fetching current progress: {}" no Illusion Buster
- ⚠️ **Isso significa que a tabela `illusion_buster_progress` não existe!**
- Execute a migração `011_illusion_buster_progress.sql` no SQL Editor
- Verifique no Table Editor se a tabela foi criada
- Recarregue a página do app

## 📚 Mais Informações

Para mais detalhes sobre a estrutura das tabelas, consulte:
- `supabase/README.md` - Documentação completa do schema

