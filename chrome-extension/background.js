chrome.action.onClicked.addListener((tab) => {
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('chrome-extension://')) return

  chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' }, (response) => {
    if (chrome.runtime.lastError) {
      // Content script not ready yet — inject manually as fallback then retry
      chrome.scripting.executeScript(
        { target: { tabId: tab.id }, files: ['content.js'] },
        () => {
          if (chrome.runtime.lastError) return
          setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' })
          }, 150)
        }
      )
    }
  })
})