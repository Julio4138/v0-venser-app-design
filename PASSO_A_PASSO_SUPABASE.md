# 🚀 Passo a Passo: Criar Tabelas no Supabase

## ⚠️ IMPORTANTE: Siga estes passos EXATAMENTE

### Passo 1: Acesse o Supabase
1. Abra seu navegador
2. Vá para: **https://app.supabase.com**
3. Faça login na sua conta
4. Selecione o projeto VENSER (ou crie um novo projeto)

### Passo 2: Abra o SQL Editor
1. No menu lateral esquerdo, procure por **"SQL Editor"**
2. Clique em **"SQL Editor"**
3. Você verá uma tela com um editor de código

### Passo 3: Abra o Arquivo SQL
1. No seu computador, abra o arquivo: **`supabase/setup.sql`**
2. Selecione TODO o conteúdo (Ctrl+A ou Cmd+A)
3. Copie TODO o conteúdo (Ctrl+C ou Cmd+C)

### Passo 4: Cole no Supabase
1. Volte para o Supabase SQL Editor
2. Clique dentro da área de texto do editor
3. Cole o conteúdo (Ctrl+V ou Cmd+V)
4. **IMPORTANTE**: Certifique-se de que TODO o código foi colado

### Passo 5: Execute o SQL
1. Procure o botão **"Run"** ou **"RUN"** no canto superior direito
2. Clique no botão **"Run"**
3. **OU** pressione **Ctrl+Enter** (Windows/Linux) ou **Cmd+Enter** (Mac)

### Passo 6: Aguarde a Execução
- Você verá uma mensagem de "Success" ou "Query executed successfully"
- Se houver erros, eles aparecerão em vermelho

### Passo 7: Verifique se Funcionou
1. No menu lateral, clique em **"Table Editor"**
2. Você deve ver estas tabelas criadas:
   - ✅ `profiles`
   - ✅ `user_progress`
   - ✅ `daily_checkins`
   - ✅ `program_days`
   - ✅ `daily_missions`
   - ✅ `mission_completions`
   - ✅ `milestones`
   - ✅ `mood_entries`
   - ✅ `productivity_entries`

### Passo 8: Verifique as Missões
1. Clique na tabela **`daily_missions`**
2. Você deve ver 5 missões cadastradas
3. Se não aparecer, algo deu errado

## 🎯 Se Não Funcionou

### Erro: "relation already exists"
- Significa que algumas tabelas já existem
- Execute este comando primeiro para limpar:
```sql
DROP TABLE IF EXISTS public.productivity_entries CASCADE;
DROP TABLE IF EXISTS public.mood_entries CASCADE;
DROP TABLE IF EXISTS public.milestones CASCADE;
DROP TABLE IF EXISTS public.mission_completions CASCADE;
DROP TABLE IF EXISTS public.daily_missions CASCADE;
DROP TABLE IF EXISTS public.program_days CASCADE;
DROP TABLE IF EXISTS public.daily_checkins CASCADE;
DROP TABLE IF EXISTS public.user_progress CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
```
- Depois execute o `setup.sql` novamente

### Erro: "permission denied"
- Verifique se você está logado como administrador do projeto
- Verifique se tem permissões para criar tabelas

### Nada aconteceu
- Verifique se copiou TODO o conteúdo do arquivo
- Verifique se clicou em "Run"
- Veja se há mensagens de erro no console

## 📸 Screenshots de Referência

### Onde encontrar SQL Editor:
```
Menu Lateral → SQL Editor → New query
```

### Onde encontrar Table Editor:
```
Menu Lateral → Table Editor
```

## ✅ Teste Final

Para testar se está funcionando:

1. Crie uma conta de teste no seu app
2. Volte ao Supabase → Table Editor → `profiles`
3. Você deve ver um novo registro com o email do usuário testado

## 🆘 Precisa de Ajuda?

Se ainda não funcionou:
1. Tire um print da tela de erro
2. Verifique se todas as tabelas aparecem no Table Editor
3. Tente executar o SQL em partes menores

