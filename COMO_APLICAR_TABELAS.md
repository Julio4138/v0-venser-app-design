# 📊 Como Aplicar as Tabelas no Supabase

## Passo a Passo Rápido

### 1. Acesse o Supabase Dashboard
- Vá para [https://app.supabase.com](https://app.supabase.com)
- Faça login na sua conta
- Selecione o projeto VENSER (ou crie um novo)

### 2. Abra o SQL Editor
- No menu lateral, clique em **SQL Editor**
- Clique em **New query**

### 3. Copie e Cole o SQL
- Abra o arquivo `supabase/migrations/001_initial_schema.sql`
- Copie **TODO** o conteúdo do arquivo
- Cole no editor SQL do Supabase

### 4. Execute o SQL
- Clique no botão **Run** (ou pressione Ctrl+Enter)
- Aguarde a execução completar

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

## 📚 Mais Informações

Para mais detalhes sobre a estrutura das tabelas, consulte:
- `supabase/README.md` - Documentação completa do schema

