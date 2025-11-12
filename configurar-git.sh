#!/bin/bash

echo "🔧 Configurando Git para Deploy"
echo "================================"
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto"
    exit 1
fi

echo "📋 Opções disponíveis:"
echo ""
echo "1. Configurar SSH (Recomendado - mais seguro)"
echo "2. Usar Personal Access Token (PAT)"
echo "3. Instalar GitHub CLI e fazer login"
echo ""
read -p "Escolha uma opção (1-3): " opcao

case $opcao in
    1)
        echo ""
        echo "🔑 Configurando SSH..."
        
        # Verificar se já existe chave SSH
        if [ -f ~/.ssh/id_ed25519.pub ]; then
            echo "✅ Chave SSH encontrada!"
            echo ""
            echo "Sua chave pública SSH:"
            cat ~/.ssh/id_ed25519.pub
            echo ""
            echo "📝 Copie a chave acima e adicione no GitHub:"
            echo "   https://github.com/settings/ssh/new"
            echo ""
            read -p "Pressione Enter após adicionar a chave no GitHub..."
        else
            read -p "Digite seu email do GitHub: " email
            ssh-keygen -t ed25519 -C "$email" -f ~/.ssh/id_ed25519 -N ""
            echo ""
            echo "✅ Chave SSH criada!"
            echo ""
            echo "Sua chave pública SSH:"
            cat ~/.ssh/id_ed25519.pub
            echo ""
            echo "📝 Copie a chave acima e adicione no GitHub:"
            echo "   https://github.com/settings/ssh/new"
            echo ""
            read -p "Pressione Enter após adicionar a chave no GitHub..."
        fi
        
        # Alterar remote para SSH
        git remote set-url origin git@github.com:Julio4138/v0-venser-app-design.git
        echo ""
        echo "✅ Remote configurado para SSH!"
        echo ""
        echo "🧪 Testando conexão..."
        ssh -T git@github.com 2>&1 | head -3
        
        echo ""
        echo "✅ Configuração concluída!"
        echo ""
        echo "🚀 Agora você pode fazer push com:"
        echo "   git push origin main"
        ;;
        
    2)
        echo ""
        echo "🔑 Configurando com Personal Access Token..."
        echo ""
        echo "📝 Para criar um token:"
        echo "   1. Acesse: https://github.com/settings/tokens"
        echo "   2. Clique em 'Generate new token (classic)'"
        echo "   3. Dê um nome e selecione 'repo' (todas as permissões)"
        echo "   4. Copie o token gerado"
        echo ""
        read -p "Cole seu token aqui: " token
        
        if [ -z "$token" ]; then
            echo "❌ Token não fornecido!"
            exit 1
        fi
        
        # Configurar remote com token
        git remote set-url origin https://${token}@github.com/Julio4138/v0-venser-app-design.git
        echo ""
        echo "✅ Remote configurado com token!"
        echo ""
        echo "🚀 Agora você pode fazer push com:"
        echo "   git push origin main"
        ;;
        
    3)
        echo ""
        echo "📦 Instalando GitHub CLI..."
        
        if ! command -v brew &> /dev/null; then
            echo "❌ Homebrew não encontrado. Instale em: https://brew.sh"
            exit 1
        fi
        
        brew install gh
        echo ""
        echo "✅ GitHub CLI instalado!"
        echo ""
        echo "🔐 Fazendo login..."
        gh auth login
        
        echo ""
        echo "✅ Login concluído!"
        echo ""
        echo "🚀 Agora você pode fazer push com:"
        echo "   git push origin main"
        ;;
        
    *)
        echo "❌ Opção inválida!"
        exit 1
        ;;
esac

echo ""
echo "✨ Próximos passos:"
echo "   1. git add ."
echo "   2. git commit -m 'Sua mensagem'"
echo "   3. git push origin main"
echo "   4. Verificar deploy no Vercel: https://vercel.com"

