# 🎯 Programa de 90 Dias - Documentação

## 📋 Visão Geral

O Programa de 90 Dias é uma funcionalidade completa de jornada estruturada que ajuda os usuários a criar rotina, compromisso e senso de evolução através de uma timeline interativa com desbloqueio progressivo e gamificação.

## 🏗️ Estrutura do Banco de Dados

### Tabelas Criadas

1. **`program_day_templates`** - Templates dos dias (gerenciados pelo admin)
   - Armazena conteúdo, áudio, vídeo, citações motivacionais
   - Suporte multi-idioma (PT, EN, ES)
   - XP de recompensa configurável

2. **`program_day_tasks`** - Tarefas/Checklist de cada dia
   - Tipos: checklist, reflection, meditation, reading
   - XP individual por tarefa
   - Tarefas obrigatórias vs opcionais

3. **`program_day_user_progress`** - Progresso do usuário
   - Status de conclusão de cada tarefa
   - Reflexão final do usuário
   - Rastreamento de XP ganho

### Funções SQL

- `can_unlock_day()` - Verifica se um dia pode ser desbloqueado
- `complete_program_day()` - Completa um dia e desbloqueia o próximo

## 🎨 Funcionalidades Implementadas

### Para Usuários (`/program`)

1. **Timeline Interativa**
   - 90 cards (ou quantidade configurável) organizados por semanas
   - Status visual: Completo, Atual, Bloqueado
   - Indicador de streak (sequência de dias)

2. **Sistema de Desbloqueio Progressivo**
   - Dia 1 sempre desbloqueado
   - Próximos dias só desbloqueiam após completar o anterior
   - Reforça disciplina e compromisso

3. **Conteúdo do Dia**
   - Texto formatado (HTML)
   - Áudio motivacional (player integrado)
   - Vídeo motivacional (player integrado)
   - Citação inspiradora

4. **Checklist de Tarefas**
   - Barra de progresso visual
   - Tipos de tarefas com ícones distintos
   - XP individual por tarefa
   - Tarefas obrigatórias marcadas

5. **Reflexão Final**
   - Campo de texto para reflexão do dia
   - Limite de 500 caracteres
   - Privado e confidencial

6. **Gamificação**
   - XP ganho por dia e tarefas
   - Streak counter (sequência de dias)
   - Níveis e conquistas (preparado para expansão)

### Para Administradores (`/admin/program`)

1. **Gerenciamento de Templates**
   - Criar novos dias do programa
   - Editar dias existentes
   - Excluir dias
   - Ativar/desativar dias

2. **Conteúdo Multi-idioma**
   - Suporte para Português, Inglês e Espanhol
   - Tabs para alternar entre idiomas
   - Campos separados por idioma

3. **Gerenciamento de Tarefas**
   - Adicionar múltiplas tarefas por dia
   - Configurar tipo, XP, obrigatoriedade
   - Reordenar tarefas

4. **Mídia**
   - URLs para áudio e vídeo
   - Suporte para qualquer fonte de mídia

## 🚀 Como Usar

### 1. Configurar Banco de Dados

Execute a migração SQL no Supabase:

```sql
-- Execute o arquivo: supabase/migrations/002_program_structure.sql
```

### 2. Criar Templates (Admin)

1. Acesse `/admin/program`
2. Clique em "Novo Dia"
3. Preencha:
   - Número do dia
   - Título (obrigatório em PT)
   - Conteúdo de texto
   - URLs de áudio/vídeo (opcional)
   - Citação motivacional
   - XP de recompensa
4. Adicione tarefas:
   - Clique em "Adicionar Tarefa"
   - Configure título, tipo, XP, obrigatoriedade
5. Salve o template

### 3. Usuário Acessa o Programa

1. Acesse `/program`
2. Veja a timeline com todos os dias
3. Clique no dia atual (desbloqueado)
4. Leia o conteúdo do dia
5. Complete as tarefas obrigatórias
6. Faça sua reflexão final
7. Clique em "Completar Dia"
8. O próximo dia será desbloqueado automaticamente

## 📱 Componentes Criados

1. **`ProgramDayContent`** - Exibe conteúdo do dia (texto, áudio, vídeo)
2. **`ProgramDayChecklist`** - Lista de tarefas com progresso
3. **`ProgramDayReflection`** - Campo de reflexão final
4. **`DayCard`** - Card individual na timeline (já existia, mantido)

## 🔒 Segurança

- RLS (Row Level Security) configurado
- Usuários só veem seus próprios dados
- Admin precisa ter `is_pro = TRUE` no perfil
- Políticas de segurança aplicadas

## 🎯 Próximos Passos (Sugestões)

1. **Notificações Push**
   - Lembretes diários para completar o dia
   - Integração com Supabase Messaging

2. **Estatísticas Avançadas**
   - Gráficos de progresso
   - Análise de reflexões
   - Comparação com outros usuários (anônimo)

3. **Conquistas**
   - Badges por marcos (7 dias, 30 dias, 90 dias)
   - Conquistas especiais

4. **Comunidade**
   - Compartilhar reflexões (opcional)
   - Grupos de apoio

5. **Personalização**
   - Usuário pode definir quantidade de dias
   - Temas personalizados
   - Lembretes customizados

## 📝 Notas Importantes

- O sistema usa `user_progress.current_day` para rastrear o progresso
- Dias são criados automaticamente quando o usuário se registra (via trigger)
- Templates são globais, mas o progresso é individual
- XP é acumulado no `user_progress.total_xp`

## 🐛 Troubleshooting

### Dia não desbloqueia
- Verifique se o dia anterior foi completado
- Confirme que todas as tarefas obrigatórias foram concluídas
- Verifique os logs do Supabase

### Erro ao salvar template (Admin)
- Verifique se tem permissão de admin (`is_pro = TRUE`)
- Confirme que o número do dia não está duplicado
- Verifique os campos obrigatórios

### Tarefas não aparecem
- Verifique se o template tem tarefas cadastradas
- Confirme que o `template_id` está correto no `program_days`





