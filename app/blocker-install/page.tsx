"use client"

import { useState } from "react"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { MobileNav } from "@/components/mobile-nav"
import { MobileHeader } from "@/components/mobile-header"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Download, Chrome, Globe, CheckCircle, ArrowRight, Copy, Check } from "lucide-react"
import Link from "next/link"

export default function BlockerInstallPage() {
  const { language } = useLanguage()
  const t = translations[language]
  const { collapsed } = useSidebar()
  const [copied, setCopied] = useState(false)

  const handleDownload = async () => {
    try {
      // Busca os arquivos da extensão via API
      const response = await fetch('/api/download-extension')
      const data = await response.json()
      
      if (data.files) {
        // Cria um arquivo README com instruções e links para os arquivos
        const readme = `VENSER Blocker Extension
========================

INSTRUÇÕES DE INSTALAÇÃO
------------------------

1. Todos os arquivos necessários estão na pasta browser-extension do projeto
2. Você pode acessar os arquivos diretamente no repositório GitHub
3. Ou copiar os arquivos manualmente da pasta browser-extension

ARQUIVOS NECESSÁRIOS:
- manifest.json
- background.js
- popup.html
- popup.js
- blocked.html

COMO INSTALAR:
-------------

Chrome/Edge Desktop:
1. Abra chrome://extensions/ (ou edge://extensions/)
2. Ative o "Modo do desenvolvedor"
3. Clique em "Carregar sem compactação"
4. Selecione a pasta browser-extension

Chrome Mobile:
1. Mesmo processo, mas no Chrome mobile
2. Acesse chrome://extensions/ no celular
3. Siga os mesmos passos

Firefox:
1. Abra about:debugging
2. Clique em "Este Firefox"
3. Clique em "Carregar extensão temporária"
4. Selecione o arquivo manifest.json

NOTA:
-----
Os arquivos estão disponíveis na pasta browser-extension do projeto.
Se você tem acesso ao código-fonte, pode copiar os arquivos diretamente.
Caso contrário, entre em contato com o suporte para obter os arquivos.`
        
        const blob = new Blob([readme], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'VENSER-Blocker-Instrucoes.txt'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        // Mostra mensagem informativa
        alert('Instruções baixadas! Os arquivos da extensão estão na pasta browser-extension do projeto. Se você tem acesso ao código-fonte, pode copiar os arquivos diretamente.')
      }
    } catch (error) {
      console.error('Erro ao baixar:', error)
      alert('Os arquivos da extensão estão na pasta browser-extension do projeto. Acesse o repositório ou copie os arquivos manualmente.')
    }
  }

  const copyInstructions = () => {
    const instructions = `1. Baixe a extensão VENSER Blocker
2. Extraia o arquivo ZIP
3. Abra chrome://extensions/ (ou edge://extensions/)
4. Ative o "Modo do desenvolvedor"
5. Clique em "Carregar sem compactação"
6. Selecione a pasta extraída`
    
    navigator.clipboard.writeText(instructions)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen starry-background">
      <MobileHeader />
      <DesktopSidebar />

      <div className={cn(collapsed ? "md:ml-20 lg:ml-20" : "md:ml-56 lg:ml-64")}>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-8 py-6 md:py-8 space-y-6 md:space-y-8 pb-20 md:pb-8">
          {/* Header */}
          <div className="text-center space-y-4 mb-8">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="relative bg-gradient-to-br from-red-900/80 to-red-800/80 p-6 rounded-full border-4 border-red-400/50">
                  <Shield className="h-12 w-12 text-red-400" strokeWidth={1.5} />
                </div>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Instalar VENSER Blocker
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Proteja-se em todo o navegador. A extensão bloqueia sites problemáticos automaticamente, mesmo quando você digita a URL diretamente.
            </p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="p-6 bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-white/10 backdrop-blur-sm">
              <CheckCircle className="h-8 w-8 text-green-400 mb-4" />
              <h3 className="font-semibold text-white mb-2">Bloqueio Completo</h3>
              <p className="text-sm text-white/70">
                Funciona em todo o navegador, bloqueando até URLs digitadas diretamente
              </p>
            </Card>
            
            <Card className="p-6 bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-white/10 backdrop-blur-sm">
              <Globe className="h-8 w-8 text-blue-400 mb-4" />
              <h3 className="font-semibold text-white mb-2">Desktop e Mobile</h3>
              <p className="text-sm text-white/70">
                Funciona no Chrome e Edge, tanto no computador quanto no celular
              </p>
            </Card>
            
            <Card className="p-6 bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-white/10 backdrop-blur-sm">
              <Shield className="h-8 w-8 text-red-400 mb-4" />
              <h3 className="font-semibold text-white mb-2">Proteção Automática</h3>
              <p className="text-sm text-white/70">
                Bloqueia automaticamente sem precisar fazer nada
              </p>
            </Card>
          </div>

          {/* Download Section */}
          <Card className="p-8 bg-gradient-to-br from-red-950/80 to-orange-950/80 border-red-500/30 backdrop-blur-sm">
            <div className="text-center space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                Como Obter a Extensão
              </h2>
              
              <div className="bg-white/5 rounded-lg p-6 text-left space-y-4 mb-6">
                <div>
                  <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <span>📁</span> Onde estão os arquivos?
                  </h3>
                  <p className="text-sm text-white/80 ml-6">
                    Os arquivos da extensão estão na pasta <code className="bg-white/10 px-2 py-1 rounded text-xs">browser-extension</code> do projeto.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <span>🔧</span> Opções para obter:
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-white/80 ml-6">
                    <li>Se você tem acesso ao código-fonte: copie os arquivos da pasta <code className="bg-white/10 px-2 py-1 rounded text-xs">browser-extension</code></li>
                    <li>Se o projeto está no GitHub: navegue até a pasta <code className="bg-white/10 px-2 py-1 rounded text-xs">browser-extension</code> e baixe os arquivos</li>
                    <li>Entre em contato com o suporte para obter os arquivos</li>
                  </ol>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  <Download className="h-5 w-5" />
                  Baixar Instruções Completas
                </button>
                
                <button
                  onClick={copyInstructions}
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors border border-white/20"
                >
                  {copied ? (
                    <>
                      <Check className="h-5 w-5" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-5 w-5" />
                      Copiar Instruções
                    </>
                  )}
                </button>
              </div>
            </div>
          </Card>

          {/* Installation Instructions */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">
              Como Instalar
            </h2>

            {/* Chrome/Edge Desktop */}
            <Card className="p-6 bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <Chrome className="h-6 w-6 text-blue-400" />
                <h3 className="text-xl font-semibold text-white">
                  Chrome/Edge (Desktop)
                </h3>
              </div>
              
              <ol className="space-y-4 text-white/90">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center font-semibold text-blue-400">
                    1
                  </span>
                  <div>
                    <p className="font-semibold">Baixe e extraia a extensão</p>
                    <p className="text-sm text-white/70">Baixe o arquivo ZIP e extraia em uma pasta</p>
                  </div>
                </li>
                
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center font-semibold text-blue-400">
                    2
                  </span>
                  <div>
                    <p className="font-semibold">Abra as extensões</p>
                    <p className="text-sm text-white/70">
                      Digite <code className="bg-white/10 px-2 py-1 rounded">chrome://extensions/</code> na barra de endereços
                    </p>
                  </div>
                </li>
                
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center font-semibold text-blue-400">
                    3
                  </span>
                  <div>
                    <p className="font-semibold">Ative o Modo do Desenvolvedor</p>
                    <p className="text-sm text-white/70">No canto superior direito, ative o toggle "Modo do desenvolvedor"</p>
                  </div>
                </li>
                
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center font-semibold text-blue-400">
                    4
                  </span>
                  <div>
                    <p className="font-semibold">Carregue a extensão</p>
                    <p className="text-sm text-white/70">Clique em "Carregar sem compactação" e selecione a pasta extraída</p>
                  </div>
                </li>
                
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/30 flex items-center justify-center font-semibold text-green-400">
                    ✓
                  </span>
                  <div>
                    <p className="font-semibold">Pronto!</p>
                    <p className="text-sm text-white/70">A extensão está instalada e funcionando</p>
                  </div>
                </li>
              </ol>
            </Card>

            {/* Chrome Mobile */}
            <Card className="p-6 bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <Chrome className="h-6 w-6 text-blue-400" />
                <h3 className="text-xl font-semibold text-white">
                  Chrome (Mobile Android)
                </h3>
              </div>
              
              <ol className="space-y-4 text-white/90">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center font-semibold text-blue-400">
                    1
                  </span>
                  <div>
                    <p className="font-semibold">Baixe no celular</p>
                    <p className="text-sm text-white/70">Baixe o arquivo ZIP no seu celular Android</p>
                  </div>
                </li>
                
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center font-semibold text-blue-400">
                    2
                  </span>
                  <div>
                    <p className="font-semibold">Extraia o arquivo</p>
                    <p className="text-sm text-white/70">Use um app de gerenciamento de arquivos para extrair o ZIP</p>
                  </div>
                </li>
                
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center font-semibold text-blue-400">
                    3
                  </span>
                  <div>
                    <p className="font-semibold">Siga os passos do desktop</p>
                    <p className="text-sm text-white/70">O processo é o mesmo: chrome://extensions/ → Modo desenvolvedor → Carregar sem compactação</p>
                  </div>
                </li>
              </ol>
            </Card>

            {/* Firefox */}
            <Card className="p-6 bg-gradient-to-br from-orange-950/60 to-red-950/60 border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="h-6 w-6 text-orange-400" />
                <h3 className="text-xl font-semibold text-white">
                  Firefox
                </h3>
              </div>
              
              <ol className="space-y-4 text-white/90">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/30 flex items-center justify-center font-semibold text-orange-400">
                    1
                  </span>
                  <div>
                    <p className="font-semibold">Abra about:debugging</p>
                    <p className="text-sm text-white/70">Digite <code className="bg-white/10 px-2 py-1 rounded">about:debugging</code> na barra de endereços</p>
                  </div>
                </li>
                
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/30 flex items-center justify-center font-semibold text-orange-400">
                    2
                  </span>
                  <div>
                    <p className="font-semibold">Clique em "Este Firefox"</p>
                    <p className="text-sm text-white/70">No menu lateral, selecione "Este Firefox"</p>
                  </div>
                </li>
                
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/30 flex items-center justify-center font-semibold text-orange-400">
                    3
                  </span>
                  <div>
                    <p className="font-semibold">Carregue a extensão</p>
                    <p className="text-sm text-white/70">Clique em "Carregar extensão temporária" e selecione o arquivo manifest.json</p>
                  </div>
                </li>
              </ol>
            </Card>
          </div>

          {/* Important Notes */}
          <Card className="p-6 bg-gradient-to-br from-yellow-950/60 to-orange-950/60 border-yellow-500/30 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-yellow-400" />
              Informações Importantes
            </h3>
            <ul className="space-y-2 text-white/90 text-sm">
              <li className="flex gap-2">
                <span className="text-yellow-400">•</span>
                <span>A extensão funciona apenas no navegador onde está instalada</span>
              </li>
              <li className="flex gap-2">
                <span className="text-yellow-400">•</span>
                <span>Você precisa instalar manualmente (não está na Chrome Web Store ainda)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-yellow-400">•</span>
                <span>A extensão precisa de permissões para bloquear requisições web</span>
              </li>
              <li className="flex gap-2">
                <span className="text-yellow-400">•</span>
                <span>Para proteção completa, use junto com outras ferramentas de bloqueio</span>
              </li>
            </ul>
          </Card>

          {/* Back to Dashboard */}
          <div className="flex justify-center pt-6">
            <Link href="/dashboard">
              <button className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors border border-white/20">
                <ArrowRight className="h-4 w-4 rotate-180" />
                Voltar ao Dashboard
              </button>
            </Link>
          </div>
        </main>
      </div>

      <MobileNav translations={t} />
    </div>
  )
}

