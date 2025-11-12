'use client'

import { useEffect } from 'react'

/**
 * Componente que força o navegador a buscar a versão mais recente
 * ignorando o cache quando necessário
 */
export function ForceReload() {
  useEffect(() => {
    // Força o navegador a buscar a versão mais recente
    // Adiciona um timestamp aos recursos para evitar cache
    if (typeof window !== 'undefined') {
      // Limpa qualquer cache do service worker se existir
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.update()
          })
        })
      }

      // Adiciona listener para detectar quando a página está online
      // e força reload se necessário
      const handleOnline = () => {
        // Força reload quando voltar online para pegar versão mais recente
        if (document.visibilityState === 'visible') {
          window.location.reload()
        }
      }

      window.addEventListener('online', handleOnline)

      return () => {
        window.removeEventListener('online', handleOnline)
      }
    }
  }, [])

  return null
}

