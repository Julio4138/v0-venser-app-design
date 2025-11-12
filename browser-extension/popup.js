// Carrega estado atual
chrome.storage.local.get(['enabled'], (result) => {
  const enabled = result.enabled || false
  const toggle = document.getElementById('toggle')
  
  if (enabled) {
    toggle.classList.add('active')
  }
  
  toggle.addEventListener('click', () => {
    const newState = !toggle.classList.contains('active')
    chrome.storage.local.set({ enabled: newState }, () => {
      if (newState) {
        toggle.classList.add('active')
      } else {
        toggle.classList.remove('active')
      }
    })
  })
})

// Botão para abrir dashboard
document.getElementById('settingsBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://venser.app/dashboard' })
})

