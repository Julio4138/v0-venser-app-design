# VENSER Content Blocker - Extensão de Navegador

Esta extensão bloqueia sites problemáticos em todo o navegador, funcionando tanto no desktop quanto no mobile.

## Instalação

### Chrome/Edge (Desktop e Mobile)

1. Abra o Chrome/Edge e vá para `chrome://extensions/` (ou `edge://extensions/`)
2. Ative o "Modo do desenvolvedor" (Developer mode) no canto superior direito
3. Clique em "Carregar sem compactação" (Load unpacked)
4. Selecione a pasta `browser-extension`
5. A extensão estará instalada e ativa

### Firefox

1. Abra o Firefox e vá para `about:debugging`
2. Clique em "Este Firefox" (This Firefox)
3. Clique em "Carregar extensão temporária" (Load Temporary Add-on)
4. Selecione o arquivo `manifest.json` na pasta `browser-extension`
5. A extensão estará instalada

## Funcionalidades

- ✅ Bloqueia sites problemáticos em todo o navegador
- ✅ Funciona em desktop e mobile
- ✅ Bloqueia navegação direta (digitar URL)
- ✅ Bloqueia links em qualquer página
- ✅ Lista padrão de 20+ sites bloqueados
- ✅ Pode ser ativado/desativado facilmente
- ✅ Sincroniza com o dashboard VENSER

## Como Funciona

A extensão intercepta todas as requisições de navegação e verifica se o domínio está na lista de sites bloqueados. Se estiver, redireciona automaticamente para uma página de bloqueio motivacional.

## Notas

- A extensão precisa de permissões para bloquear requisições web
- Funciona apenas no navegador onde está instalada
- Para proteção completa, recomenda-se usar junto com outras ferramentas (DNS filtering, etc.)

