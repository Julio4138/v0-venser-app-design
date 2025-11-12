# 🤖 Como Configurar o Agente IA - Tony

Este documento explica como configurar e gerenciar o agente IA Tony no painel administrativo.

## 📋 O que foi criado

### Tabelas do Banco de Dados

1. **`ai_agent_config`** - Configurações gerais do agente
   - System prompt
   - Traços de personalidade
   - Regras de comportamento
   - Configurações técnicas (temperatura, tokens, modelo)

2. **`ai_agent_knowledge_base`** - Base de conhecimento
   - Textos e documentos
   - FAQs
   - Diretrizes
   - Arquivos anexados

3. **`ai_agent_conversations`** - Histórico de conversas
   - Para análise e melhoria contínua

## 🚀 Como Aplicar

### Passo 1: Aplicar Migration SQL

Execute a migration `008_ai_agent_config.sql` no Supabase:

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá em **SQL Editor**
3. Execute o conteúdo de `supabase/migrations/008_ai_agent_config.sql`

### Passo 2: Criar Bucket de Storage

O bucket de storage precisa ser criado manualmente:

1. No Supabase Dashboard, vá em **Storage**
2. Clique em **New bucket**
3. Configure:
   - **Name:** `ai-agent-files`
   - **Public bucket:** ✅ Sim (ou não, dependendo da sua preferência)
   - **File size limit:** 10MB
   - **Allowed MIME types:** `application/pdf, text/plain, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/markdown`

4. Configure as políticas de acesso (veja `009_create_storage_bucket.sql`)

### Passo 3: Acessar o Painel

1. Acesse `/admin/ai-agent`
2. Configure o agente conforme necessário

## 🎯 Funcionalidades do Painel

### Aba: Configurações

- **System Prompt**: Define a identidade e comportamento base do agente
- **Traços de Personalidade**: Sliders para ajustar empatia, paciência, motivação, etc.
- **Regras de Comportamento**: Lista de regras que o agente deve seguir
- **Configurações Técnicas**: Temperatura, max tokens, modelo de IA

### Aba: Base de Conhecimento

- **Adicionar Itens**: Textos, documentos, FAQs, diretrizes
- **Upload de Arquivos**: PDF, TXT, DOC, DOCX, MD
- **Categorização**: Organize por categorias
- **Priorização**: Defina prioridade dos itens
- **Ativar/Desativar**: Controle quais itens estão ativos

### Aba: Conversas

- Histórico de conversas dos usuários
- Análise de feedback e ratings
- Melhoria contínua baseada em dados

## 📝 Exemplo de System Prompt

```
Você é Tony, um assistente virtual especializado em ajudar pessoas em sua jornada de recuperação e transformação pessoal. Você é empático, compreensivo, motivador e sempre focado no bem-estar do usuário. Use uma linguagem acolhedora e profissional, oferecendo suporte prático e emocional.

Sua missão é:
- Ajudar usuários a superar desafios
- Oferecer motivação e encorajamento
- Fornecer informações úteis sobre recuperação
- Ser um companheiro confiável na jornada

Sempre seja respeitoso, não julgador e focado em soluções.
```

## 🔒 Segurança

- Apenas administradores podem editar configurações
- Usuários podem ver apenas itens ativos da base de conhecimento
- Conversas são privadas (usuários veem apenas as suas)
- Admins podem ver todas as conversas para análise

## 📊 Estrutura de Dados

### Personalidade (JSON)
```json
{
  "empathy": 9,
  "patience": 10,
  "motivation": 9,
  "professionalism": 8,
  "warmth": 9
}
```

### Regras de Comportamento (Array)
```json
[
  "Sempre seja respeitoso e não julgador",
  "Ofereça suporte prático e emocional",
  "Celebre pequenas vitórias do usuário"
]
```

## 🎨 Tipos de Conteúdo

- **text**: Texto simples
- **document**: Documento completo
- **faq**: Perguntas frequentes
- **guideline**: Diretrizes e regras

## ⚠️ Notas Importantes

1. **Storage Bucket**: Certifique-se de criar o bucket antes de fazer upload de arquivos
2. **System Prompt**: É a configuração mais importante - defina bem a personalidade
3. **Base de Conhecimento**: Quanto mais informações, melhor o agente responderá
4. **Teste Regularmente**: Teste o agente após mudanças para garantir qualidade

## 🔄 Próximos Passos

1. Integrar com API de IA (OpenAI, Anthropic, etc.)
2. Implementar sistema de embeddings para busca semântica
3. Adicionar análise de sentimento nas conversas
4. Criar dashboard de métricas do agente

