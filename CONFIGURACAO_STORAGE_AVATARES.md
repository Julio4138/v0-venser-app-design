# 📸 Configuração do Storage para Avatares

## 🎯 Visão Geral

Este documento descreve como configurar o bucket de storage no Supabase para permitir o upload de fotos de perfil dos usuários.

## 📋 Passos para Configuração

### 1. Criar o Bucket no Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Storage** no menu lateral
4. Clique em **New bucket**
5. Configure:
   - **Name**: `avatars`
   - **Public bucket**: ✅ (marcado)
   - **File size limit**: 5MB (5242880 bytes)
   - **Allowed MIME types**: `image/jpeg,image/png,image/gif,image/webp`

### 2. Configurar Políticas de Acesso (RLS)

Execute o seguinte SQL no SQL Editor do Supabase:

```sql
-- Política para permitir que usuários vejam avatares públicos
CREATE POLICY "Avatares são públicos"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Política para permitir que usuários façam upload de seus próprios avatares
-- O nome do arquivo começa com o user_id: {user_id}_{timestamp}.{ext}
CREATE POLICY "Usuários podem fazer upload de seus avatares"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  name LIKE auth.uid()::text || '_%'
);

-- Política para permitir que usuários atualizem seus próprios avatares
CREATE POLICY "Usuários podem atualizar seus avatares"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  name LIKE auth.uid()::text || '_%'
)
WITH CHECK (
  bucket_id = 'avatars' AND
  name LIKE auth.uid()::text || '_%'
);

-- Política para permitir que usuários deletem seus próprios avatares
CREATE POLICY "Usuários podem deletar seus avatares"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  name LIKE auth.uid()::text || '_%'
);
```

**Alternativa mais simples (se as políticas acima não funcionarem):**

```sql
-- Política para permitir que usuários vejam avatares públicos
CREATE POLICY "Avatares são públicos"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Política para permitir que usuários autenticados façam upload
CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid() IS NOT NULL
);

-- Política para permitir que usuários autenticados atualizem
CREATE POLICY "Usuários autenticados podem atualizar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid() IS NOT NULL
)
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid() IS NOT NULL
);

-- Política para permitir que usuários autenticados deletem
CREATE POLICY "Usuários autenticados podem deletar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid() IS NOT NULL
);
```

### 3. Estrutura de Arquivos

Os avatares serão armazenados diretamente no bucket `avatars` com o seguinte formato de nome:
```
{user_id}_{timestamp}.{ext}
```

Exemplo: `123e4567-e89b-12d3-a456-426614174000_1704067200000.jpg`

**Nota:** O bucket se chama `avatars`, então os arquivos ficam na raiz do bucket, não em uma subpasta.

## ✅ Funcionalidades Implementadas

- ✅ Upload de foto de perfil (JPG, PNG, GIF, WebP)
- ✅ Validação de tamanho (máximo 5MB)
- ✅ Preview da imagem antes do upload
- ✅ Remoção de avatar antigo ao fazer upload de novo
- ✅ Botão para remover avatar
- ✅ Atualização automática do perfil após upload

## 🔒 Segurança

- Apenas usuários autenticados podem fazer upload
- Usuários só podem fazer upload/atualizar/deletar seus próprios avatares
- Validação de tipo de arquivo no frontend e backend
- Limite de tamanho de arquivo (5MB)

## 📝 Notas

- O bucket deve ser público para que as imagens sejam acessíveis via URL pública
- As políticas RLS garantem que apenas o dono do avatar possa modificá-lo
- O código automaticamente remove o avatar antigo ao fazer upload de um novo

