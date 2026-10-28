let lastReportedUrl = ""
let updateQueued = false

function reportPageContext(): void {
  const pageUrl = window.location.href
  if (pageUrl === lastReportedUrl) return
  lastReportedUrl = pageUrl

  void chrome.runtime
    .sendMessage({ type: "GITHUB_PAGE_CONTEXT" })
    .catch((error: unknown) => console.debug("RepoMind page context was not delivered.", error))
}

function checkForRouteChange(): void {
  if (window.location.href === lastReportedUrl || updateQueued) return
  updateQueued = true
  queueMicrotask(() => {
    updateQueued = false
    reportPageContext()
  })
}

reportPageContext()
window.addEventListener("popstate", checkForRouteChange)
window.addEventListener("hashchange", checkForRouteChange)
window.addEventListener("turbo:load", checkForRouteChange)
window.addEventListener("turbo:render", checkForRouteChange)
new MutationObserver(checkForRouteChange).observe(document.documentElement, {
  childList: true,
  subtree: true,
})
