# Guia de Deploy e Compartilhamento no Instagram

## 🔴 Problema Identificado

Você está recebendo um erro de permissão ao tentar fazer push para o GitHub:
```
Permission denied to fluencylab2025-cmd
```

## ✅ Soluções

### Opção 1: Usar SSH (Recomendado)

1. **Verifique se você tem uma chave SSH:**
   ```bash
   ls -la ~/.ssh
   ```

2. **Se não tiver, crie uma chave SSH:**
   ```bash
   ssh-keygen -t ed25519 -C "seu-email@gmail.com"
   ```

3. **Adicione a chave SSH ao GitHub:**
   - Copie a chave pública: `cat ~/.ssh/id_ed25519.pub`
   - Vá em GitHub → Settings → SSH and GPG keys → New SSH key
   - Cole a chave e salve

4. **Altere o remote para SSH:**
   ```bash
   git remote set-url origin git@github.com:Julio4138/v0-venser-app-design.git
   ```

5. **Teste a conexão:**
   ```bash
   ssh -T git@github.com
   ```

6. **Faça o push:**
   ```bash
   git push origin main
   ```

### Opção 2: Usar Personal Access Token (PAT)

1. **Crie um Personal Access Token no GitHub:**
   - Vá em GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Clique em "Generate new token (classic)"
   - Dê um nome e selecione as permissões: `repo` (todas)
   - Copie o token gerado

2. **Configure o Git para usar o token:**
   ```bash
   git remote set-url origin https://SEU_TOKEN@github.com/Julio4138/v0-venser-app-design.git
   ```
   
   Ou use o GitHub CLI:
   ```bash
   gh auth login
   ```

3. **Faça o push:**
   ```bash
   git push origin main
   ```

### Opção 3: Usar GitHub CLI (Mais Fácil)

1. **Instale o GitHub CLI (se não tiver):**
   ```bash
   brew install gh
   ```

2. **Faça login:**
   ```bash
   gh auth login
   ```

3. **Faça o push:**
   ```bash
   git push origin main
   ```

## 🚀 Deploy no Vercel

Após conseguir fazer push para o GitHub:

1. **Acesse o Vercel:**
   - Vá em https://vercel.com
   - Faça login com sua conta

2. **Conecte o repositório:**
   - Vá em "Add New Project"
   - Selecione o repositório `v0-venser-app-design`
   - O Vercel detectará automaticamente as configurações do Next.js

3. **Deploy automático:**
   - O Vercel fará deploy automaticamente a cada push no GitHub
   - Você receberá um link como: `https://v0-venser-app-design.vercel.app`

## 📱 Compartilhar no Instagram

### Método 1: Compartilhar o Link

1. **Copie o link do seu app no Vercel**
2. **No Instagram:**
   - Crie um novo post ou story
   - Adicione uma imagem ou vídeo do seu app
   - No texto, inclua o link: `https://seu-app.vercel.app`
   - ⚠️ **Nota:** Instagram não permite links clicáveis em posts normais, apenas em stories com "Link" sticker ou na bio

### Método 2: Usar Link na Bio

1. **Adicione o link na sua bio do Instagram**
2. **Mencione no post:** "Link na bio 🔗"

### Método 3: Stories com Link Sticker

1. **Crie um story**
2. **Adicione o sticker "Link"**
3. **Cole o URL do seu app**
4. **Publicar**

### Método 4: Criar um QR Code

1. **Gere um QR Code do seu link:**
   - Use: https://qr-code-generator.com
   - Cole o link do seu app
   - Baixe a imagem

2. **Poste o QR Code no Instagram**
3. **As pessoas podem escanear e acessar**

## 🔧 Verificar Status do Deploy

```bash
# Ver commits locais não enviados
git status

# Ver diferenças
git log origin/main..HEAD

# Fazer push
git push origin main

# Verificar build local
npm run build
```

## 📝 Checklist

- [ ] Configurar credenciais do GitHub (SSH ou PAT)
- [ ] Fazer push para o GitHub
- [ ] Verificar deploy no Vercel
- [ ] Copiar link do app deployado
- [ ] Compartilhar no Instagram (bio, stories ou post)

## 🆘 Problemas Comuns

### Erro 403 ao fazer push
- **Solução:** Configure SSH ou use Personal Access Token

### Build falha no Vercel
- **Solução:** Verifique os logs no Vercel e corrija os erros

### Link não funciona no Instagram
- **Solução:** Use o sticker "Link" nos stories ou adicione na bio

## 📞 Precisa de Ajuda?

Se ainda tiver problemas, verifique:
1. Se você tem acesso ao repositório no GitHub
2. Se o Vercel está conectado ao repositório correto
3. Se o build está passando localmente (`npm run build`)

