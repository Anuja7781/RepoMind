import { getRepositoryUrlFromPage } from "./shared/repository"

interface GitHubPageContextMessage {
  type: "GITHUB_PAGE_CONTEXT"
}

function isGitHubPageContextMessage(
  message: unknown,
): message is GitHubPageContextMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    message.type === "GITHUB_PAGE_CONTEXT"
  )
}

chrome.runtime.onMessage.addListener((message: unknown, sender) => {
  if (!isGitHubPageContextMessage(message) || sender.tab?.id === undefined) return

  const repositoryUrl = getRepositoryUrlFromPage(sender.tab.url ?? "")
  const tabId = sender.tab.id

  void chrome.action
    .setBadgeBackgroundColor({ color: "#7958f5", tabId })
    .catch((error: unknown) => console.error("Could not update RepoMind badge color.", error))
  void chrome.action
    .setBadgeText({ text: repositoryUrl ? "RM" : "", tabId })
    .catch((error: unknown) => console.error("Could not update RepoMind badge.", error))
})
