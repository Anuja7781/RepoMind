const NON_REPOSITORY_ROOTS = new Set([
  "about",
  "account",
  "apps",
  "codespaces",
  "collections",
  "contact",
  "customer-stories",
  "enterprise",
  "events",
  "explore",
  "features",
  "gist",
  "issues",
  "login",
  "marketplace",
  "new",
  "notifications",
  "orgs",
  "organizations",
  "pricing",
  "readme",
  "search",
  "security",
  "sessions",
  "settings",
  "site",
  "sponsors",
  "topics",
  "user-attachments",
  "users",
])

const OWNER_PATTERN = /^[A-Za-z0-9-]+$/
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+$/

export function getRepositoryUrlFromPage(pageUrl: string): string | null {
  try {
    const url = new URL(pageUrl)
    if (
      url.protocol !== "https:" ||
      url.hostname.toLowerCase() !== "github.com" ||
      url.username ||
      url.password ||
      url.port
    ) {
      return null
    }

    const segments = url.pathname.split("/").filter(Boolean)
    if (segments.length < 2) return null

    const [owner, repository] = segments
    if (
      !owner ||
      !repository ||
      NON_REPOSITORY_ROOTS.has(owner.toLowerCase()) ||
      !OWNER_PATTERN.test(owner) ||
      !REPOSITORY_PATTERN.test(repository)
    ) {
      return null
    }

    return `https://github.com/${owner}/${repository}`
  } catch {
    return null
  }
}
