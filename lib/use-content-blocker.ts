"use client"

import { useState, useEffect } from "react"
import { supabase } from "./supabase/client"

interface ContentBlockerState {
  enabled: boolean
  loading: boolean
  blockedSites: string[]
}

// Lista padrão de sites problemáticos
const DEFAULT_BLOCKED_SITES = [
  "pornhub.com",
  "xvideos.com",
  "xhamster.com",
  "redtube.com",
  "youporn.com",
  "tube8.com",
  "spankwire.com",
  "keezmovies.com",
  "extremetube.com",
  "4tube.com",
  "tnaflix.com",
  "drtuber.com",
  "sunporno.com",
  "beeg.com",
  "nuvid.com",
  "onlyfans.com",
  "chaturbate.com",
  "myfreecams.com",
  "cam4.com",
  "stripchat.com"
]

export function useContentBlocker() {
  const [state, setState] = useState<ContentBlockerState>({
    enabled: false,
    loading: true,
    blockedSites: DEFAULT_BLOCKED_SITES
  })

  useEffect(() => {
    // Carrega preferência do localStorage
    if (typeof window !== "undefined") {
      const savedPreference = localStorage.getItem("contentBlockerEnabled")
      const enabled = savedPreference === "true"
      
      // Carrega lista personalizada de sites bloqueados
      const savedBlockedSites = localStorage.getItem("blockedSites")
      const blockedSites = savedBlockedSites 
        ? JSON.parse(savedBlockedSites)
        : DEFAULT_BLOCKED_SITES

      setState({
        enabled,
        loading: false,
        blockedSites
      })

      // Inicializa bloqueador se estiver ativado
      // Usa setTimeout para garantir que o DOM está pronto
      if (enabled) {
        setTimeout(() => {
          initializeBlocker(blockedSites)
        }, 100)
      }
    }
  }, [])

  const enableBlocker = async () => {
    if (typeof window === "undefined") return

    localStorage.setItem("contentBlockerEnabled", "true")
    
    // Salva no Supabase se houver usuário (opcional)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        if (authError.message?.includes('Failed to fetch')) {
          // Erro de rede, ignora silenciosamente
          return
        }
        throw authError
      }
      if (user) {
        await supabase
          .from("profiles")
          .update({ content_blocker_enabled: true })
          .eq("id", user.id)
          .then(() => {
            // Sucesso
          })
          .catch((error: any) => {
            // Ignora erro se coluna não existir ou erro de rede
            if (!error?.message?.includes('Failed to fetch')) {
              console.warn("Error updating content blocker:", error?.message)
            }
          })
      }
    } catch (error: any) {
      // Ignora erros de rede do Supabase
      if (!error?.message?.includes('Failed to fetch') && error?.name !== 'TypeError') {
        console.warn("Error saving content blocker:", error?.message)
      }
    }

    // Inicializa bloqueador
    setTimeout(() => {
      initializeBlocker(state.blockedSites)
    }, 100)

    setState(prev => ({
      ...prev,
      enabled: true
    }))
  }

  const disableBlocker = async () => {
    if (typeof window === "undefined") return

    localStorage.setItem("contentBlockerEnabled", "false")
    
    // Salva no Supabase (opcional)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        if (authError.message?.includes('Failed to fetch')) {
          // Erro de rede, ignora silenciosamente
          return
        }
        throw authError
      }
      if (user) {
        await supabase
          .from("profiles")
          .update({ content_blocker_enabled: false })
          .eq("id", user.id)
          .then(() => {
            // Sucesso
          })
          .catch((error: any) => {
            // Ignora erro se coluna não existir ou erro de rede
            if (!error?.message?.includes('Failed to fetch')) {
              console.warn("Error updating content blocker:", error?.message)
            }
          })
      }
    } catch (error: any) {
      // Ignora erros de rede do Supabase
      if (!error?.message?.includes('Failed to fetch') && error?.name !== 'TypeError') {
        console.warn("Error saving content blocker:", error?.message)
      }
    }

    // Remove bloqueador
    removeBlocker()

    setState(prev => ({
      ...prev,
      enabled: false
    }))
  }

  const toggleBlocker = async () => {
    if (state.enabled) {
      await disableBlocker()
    } else {
      await enableBlocker()
    }
  }

  const addBlockedSite = (site: string) => {
    const normalizedSite = normalizeSite(site)
    if (!state.blockedSites.includes(normalizedSite)) {
      const newBlockedSites = [...state.blockedSites, normalizedSite]
      localStorage.setItem("blockedSites", JSON.stringify(newBlockedSites))
      setState(prev => ({
        ...prev,
        blockedSites: newBlockedSites
      }))
      
      // Reinicializa bloqueador com nova lista
      if (state.enabled) {
        initializeBlocker(newBlockedSites)
      }
    }
  }

  const removeBlockedSite = (site: string) => {
    const newBlockedSites = state.blockedSites.filter(s => s !== site)
    localStorage.setItem("blockedSites", JSON.stringify(newBlockedSites))
    setState(prev => ({
      ...prev,
      blockedSites: newBlockedSites
    }))
    
    // Reinicializa bloqueador
    if (state.enabled) {
      initializeBlocker(newBlockedSites)
    }
  }

  return {
    ...state,
    enableBlocker,
    disableBlocker,
    toggleBlocker,
    addBlockedSite,
    removeBlockedSite
  }
}

function normalizeSite(site: string): string {
  // Remove protocolo e normaliza
  return site
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .toLowerCase()
    .split("/")[0] // Pega apenas o domínio
}

function initializeBlocker(blockedSites: string[]) {
  if (typeof window === "undefined") return

  // Remove bloqueador anterior se existir
  removeBlocker()

  // Verifica imediatamente se o site atual está bloqueado
  const currentDomain = window.location.hostname.replace(/^www\./, "").toLowerCase()
  const isCurrentBlocked = blockedSites.some(blocked => {
    const normalizedBlocked = blocked.replace(/^www\./, "").toLowerCase()
    return currentDomain === normalizedBlocked || currentDomain.endsWith("." + normalizedBlocked)
  })

  if (isCurrentBlocked && !window.location.pathname.includes("/blocked")) {
    window.location.href = "/blocked"
    return
  }

  // Cria script de bloqueio
  const script = document.createElement("script")
  script.id = "venser-content-blocker"
  script.textContent = `
    (function() {
      const blockedSites = ${JSON.stringify(blockedSites)};
      
      function normalizeDomain(hostname) {
        return hostname.replace(/^www\\./, "").toLowerCase();
      }
      
      function isBlocked(hostname) {
        const domain = normalizeDomain(hostname);
        return blockedSites.some(blocked => {
          const normalizedBlocked = normalizeDomain(blocked);
          return domain === normalizedBlocked || domain.endsWith("." + normalizedBlocked);
        });
      }
      
      // Verifica ao carregar a página
      if (isBlocked(window.location.hostname) && !window.location.pathname.includes("/blocked")) {
        window.location.href = "/blocked";
        return;
      }
      
      // Intercepta cliques em links
      document.addEventListener("click", function(e) {
        const link = e.target.closest("a");
        if (link && link.href) {
          try {
            const url = new URL(link.href);
            if (isBlocked(url.hostname)) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              window.location.href = "/blocked";
              return false;
            }
          } catch (err) {
            // Ignora erros de URL inválida
          }
        }
      }, true);
      
      // Intercepta form submissions
      document.addEventListener("submit", function(e) {
        const form = e.target;
        if (form && form.action) {
          try {
            const url = new URL(form.action, window.location.origin);
            if (isBlocked(url.hostname)) {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = "/blocked";
              return false;
            }
          } catch (err) {
            // Ignora erros
          }
        }
      }, true);
      
      // Monitora mudanças de URL (SPA)
      let lastUrl = location.href;
      const checkUrl = () => {
        const url = location.href;
        if (url !== lastUrl) {
          lastUrl = url;
          try {
            const urlObj = new URL(url);
            if (isBlocked(urlObj.hostname) && !urlObj.pathname.includes("/blocked")) {
              window.location.href = "/blocked";
            }
          } catch (err) {
            // Ignora erros
          }
        }
      };
      
      // Verifica periodicamente
      setInterval(checkUrl, 1000);
      
      // Observa mudanças no DOM
      new MutationObserver(checkUrl).observe(document, { 
        subtree: true, 
        childList: true,
        attributes: true
      });
    })();
  `
  
  document.head.appendChild(script)
}

function removeBlocker() {
  if (typeof window === "undefined") return
  
  const existingScript = document.getElementById("venser-content-blocker")
  if (existingScript) {
    existingScript.remove()
  }
}

