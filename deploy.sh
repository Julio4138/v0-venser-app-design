#!/bin/bash

echo "🚀 Deploy VENSER App"
echo "===================="
echo ""

# Verificar se há mudanças
if [ -z "$(git status --porcelain)" ]; then
    echo "⚠️  Nenhuma mudança para commitar."
    exit 0
fi

# Mostrar status
echo "📋 Mudanças detectadas:"
git status --short
echo ""

# Perguntar mensagem de commit
read -p "💬 Mensagem do commit: " mensagem

if [ -z "$mensagem" ]; then
    mensagem="Atualização automática"
fi

# Adicionar todas as mudanças
echo ""
echo "➕ Adicionando arquivos..."
git add .

# Fazer commit
echo "💾 Fazendo commit..."
git commit -m "$mensagem"

# Fazer push
echo ""
echo "📤 Enviando para GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deploy iniciado com sucesso!"
    echo ""
    echo "📊 Próximos passos:"
    echo "   1. Verifique o GitHub: https://github.com/Julio4138/v0-venser-app-design"
    echo "   2. Verifique o Vercel: https://vercel.com/julionavyy-gmailcoms-projects/v0-venser-app-design"
    echo "   3. O deploy será automático no Vercel!"
else
    echo ""
    echo "❌ Erro ao fazer push. Verifique as mensagens acima."
fi

