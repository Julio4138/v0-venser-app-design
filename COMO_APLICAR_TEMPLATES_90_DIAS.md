# 📅 Como Aplicar os Templates dos 90 Dias

Este documento explica como aplicar os templates pré-criados para os 90 dias do programa.

## 🎯 O que foi criado

Foram criados **90 templates** estruturados em 3 fases:

### 🩵 Fase 1: Reconstrução da Mente e Quebra do Ciclo (Dias 1-30)
- **Objetivo**: Romper padrões automáticos e criar consciência
- **Foco**: Consciência, reconhecimento de gatilhos, quebra de ciclos

### 💪 Fase 2: Redirecionamento e Reforço de Hábitos (Dias 31-60)
- **Objetivo**: Substituir vícios por comportamentos saudáveis
- **Foco**: Novos hábitos, substituição de comportamentos, reforço positivo

### 🔥 Fase 3: Consolidação e Identidade Nova (Dias 61-90)
- **Objetivo**: Solidificar autocontrole e visão de longo prazo
- **Foco**: Nova identidade, autocontrole avançado, impacto e legado

## 🚀 Como Aplicar

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Execute as migrations na ordem:

**Passo 1:** Execute `006_create_90_days_templates.sql`
   - Isso criará os 90 templates básicos

**Passo 2:** Execute `007_create_default_tasks.sql`
   - Isso adicionará tarefas padrão para cada template

### Opção 2: Via Supabase CLI

```bash
# Aplicar todas as migrations
supabase db push

# Ou aplicar apenas estas migrations
supabase migration up
```

## ✅ Verificação

Após aplicar as migrations, verifique se tudo foi criado:

```sql
-- Verificar quantos templates foram criados
SELECT COUNT(*) as total_templates 
FROM public.program_day_templates;

-- Deve retornar 90

-- Verificar quantas tarefas foram criadas
SELECT COUNT(*) as total_tasks 
FROM public.program_day_tasks;

-- Deve retornar pelo menos 270 (90 templates × 3 tarefas mínimas)

-- Ver templates por fase
SELECT 
  CASE 
    WHEN day_number <= 30 THEN 'Fase 1: Reconstrução'
    WHEN day_number <= 60 THEN 'Fase 2: Redirecionamento'
    ELSE 'Fase 3: Consolidação'
  END as fase,
  COUNT(*) as dias
FROM public.program_day_templates
GROUP BY fase;
```

## 📝 Estrutura dos Templates

Cada template inclui:
- **Título** em PT, EN e ES
- **Conteúdo básico** (pode ser editado pelo admin)
- **Citação motivacional** padrão
- **XP de recompensa** (50-150 XP dependendo do dia)
- **Status ativo** por padrão

## 🎨 Personalização

Os templates foram criados com conteúdo básico. O administrador pode:

1. **Editar conteúdo**: Acesse `/admin/program` e edite qualquer template
2. **Adicionar áudio/vídeo**: Adicione URLs de conteúdo multimídia
3. **Modificar tarefas**: Edite ou adicione tarefas específicas para cada dia
4. **Ajustar XP**: Modifique a recompensa de XP conforme necessário

## 📊 Tarefas Padrão

Cada template recebe automaticamente:

1. **Leitura do conteúdo** (obrigatória, 15 XP)
2. **Reflexão diária** (obrigatória, 20 XP)
3. **Autocuidado** (obrigatória, 10 XP)
4. **Meditação/Respiração** (opcional, 15 XP) - apenas em dias específicos

## 🔄 Atualizações Futuras

Se precisar atualizar os templates:

1. Edite diretamente no painel admin (`/admin/program`)
2. Ou crie uma nova migration SQL para atualizações em massa
3. Os templates podem ser editados a qualquer momento sem afetar o progresso dos usuários

## ⚠️ Notas Importantes

- **Não delete templates**: Isso pode afetar usuários que já estão no programa
- **Use `is_active = FALSE`**: Para desativar temporariamente sem deletar
- **Backup antes de mudanças**: Sempre faça backup antes de alterações em massa
- **Teste primeiro**: Teste as alterações em um ambiente de desenvolvimento

## 🎯 Próximos Passos

Após aplicar as migrations:

1. ✅ Verifique se todos os 90 templates foram criados
2. ✅ Acesse `/admin/program` para visualizar os templates
3. ✅ Personalize o conteúdo conforme necessário
4. ✅ Adicione áudios/vídeos quando disponíveis
5. ✅ Teste criando um usuário e acessando o programa

## 📞 Suporte

Se encontrar problemas:
- Verifique os logs do Supabase
- Confirme que as migrations anteriores foram aplicadas
- Certifique-se de ter permissões de administrador

