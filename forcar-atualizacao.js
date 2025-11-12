/**
 * Script para forçar atualização imediata do navegador
 * 
 * COMO USAR:
 * 1. Abra o DevTools (F12)
 * 2. Vá na aba Console
 * 3. Cole este código e pressione Enter
 * 
 * OU simplesmente execute no console:
 * location.reload(true)
 */

// Método 1: Força reload ignorando cache (funciona na maioria dos navegadores)
if (window.location.reload) {
  // Tenta usar o método mais direto
  window.location.reload(true);
} else {
  // Fallback: adiciona timestamp à URL
  window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now();
}

// Método 2: Limpa cache do Service Worker se existir
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister().then(function(boolean) {
        console.log('Service Worker desregistrado:', boolean);
      });
    }
  });
}

// Método 3: Limpa cache do navegador (requer permissão)
if ('caches' in window) {
  caches.keys().then(function(names) {
    for (let name of names) {
      caches.delete(name);
      console.log('Cache deletado:', name);
    }
  });
}

console.log('✅ Forçando atualização...');

