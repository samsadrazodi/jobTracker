// When extension icon is clicked, tell content script to toggle sidebar
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' })
})