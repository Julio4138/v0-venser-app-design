# Configuração do Supabase

## 📋 Passos para conectar o Supabase

### 1. Instalar dependências
As dependências já foram instaladas:
- `@supabase/supabase-js`
- `@supabase/ssr`

### 2. Obter credenciais do Supabase

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Crie um novo projeto ou selecione um existente
3. Vá em **Settings** > **API**
4. Copie as seguintes informações:
   - **Project URL** (URL do projeto)
   - **anon/public key** (Chave pública anônima)

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:

```env
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-projeto
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

**Exemplo:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Estrutura criada

Os seguintes arquivos foram criados para facilitar o uso do Supabase:

- **`lib/supabase/client.ts`** - Cliente para uso no lado do cliente (browser)
- **`lib/supabase/server.ts`** - Cliente para uso no servidor (Server Components, Server Actions)
- **`lib/supabase/middleware.ts`** - Middleware para gerenciar sessões de autenticação

### 5. Como usar

#### No Cliente (Client Components):
```typescript
import { supabase } from '@/lib/supabase/client'

// Exemplo: buscar dados
const { data, error } = await supabase
  .from('sua_tabela')
  .select('*')
```

#### No Servidor (Server Components):
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()

// Exemplo: buscar dados
const { data, error } = await supabase
  .from('sua_tabela')
  .select('*')
```

#### Middleware (opcional):
Se você quiser proteger rotas automaticamente, adicione o middleware em `middleware.ts` na raiz do projeto:

```typescript
import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 6. Próximos passos

- Configure suas tabelas no Supabase
- Configure políticas de segurança (RLS - Row Level Security)
- Comece a usar o Supabase nas suas páginas e componentes!

## 🔒 Segurança

⚠️ **IMPORTANTE**: Nunca commite o arquivo `.env.local` no Git. Ele já está no `.gitignore`.

