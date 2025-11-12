// Lista padrão de sites bloqueados
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

// Normaliza domínio
function normalizeDomain(hostname) {
  return hostname.replace(/^www\./, "").toLowerCase()
}

// Verifica se um domínio está bloqueado
function isBlocked(hostname) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['blockedSites', 'enabled'], (result) => {
      if (!result.enabled) {
        resolve(false)
        return
      }

      const blockedSites = result.blockedSites || DEFAULT_BLOCKED_SITES
      const domain = normalizeDomain(hostname)
      
      const isBlocked = blockedSites.some(blocked => {
        const normalizedBlocked = normalizeDomain(blocked)
        return domain === normalizedBlocked || domain.endsWith("." + normalizedBlocked)
      })
      
      resolve(isBlocked)
    })
  })
}

// Bloqueia requisições para sites bloqueados
chrome.webRequest.onBeforeRequest.addListener(
  async (details) => {
    const blocked = await isBlocked(new URL(details.url).hostname)
    
    if (blocked) {
      // Redireciona para página de bloqueio
      return {
        redirectUrl: chrome.runtime.getURL("blocked.html")
      }
    }
  },
  {
    urls: ["<all_urls>"],
    types: ["main_frame"]
  },
  ["blocking"]
)

// Intercepta tentativas de navegação
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    try {
      const url = new URL(tab.url)
      const blocked = await isBlocked(url.hostname)
      
      if (blocked && !url.href.includes("blocked.html")) {
        chrome.tabs.update(tabId, {
          url: chrome.runtime.getURL("blocked.html")
        })
      }
    } catch (e) {
      // Ignora erros
    }
  }
})

// Inicializa valores padrão
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['enabled', 'blockedSites'], (result) => {
    if (result.enabled === undefined) {
      chrome.storage.local.set({ enabled: false })
    }
    if (!result.blockedSites) {
      chrome.storage.local.set({ blockedSites: DEFAULT_BLOCKED_SITES })
    }
  })
})

