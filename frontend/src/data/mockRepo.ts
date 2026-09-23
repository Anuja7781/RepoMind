// ─── Mock Repository Engine ─────────────────────────────────────────────────
// Structured so a real GitHub API / backend can replace these exports later.
// All analysis functions accept a repoUrl and return typed results.

export interface RepoMeta {
  owner: string
  name: string
  fullName: string
  description: string
  language: string
  stars: number
  forks: number
  openIssues: number
  lastCommit: string
  defaultBranch: string
}

export interface FileNode {
  id: string
  name: string
  path: string
  type: "dir" | "file"
  language?: string
  lines?: number
  complexity?: number
  children?: FileNode[]
}

export interface ArchNode {
  id: string
  label: string
  layer: "ui" | "api" | "service" | "data" | "infra" | "util"
  x: number
  y: number
  files: number
  complexity: number
  description: string
}

export interface ArchEdge {
  id: string
  source: string
  target: string
  type: "import" | "api" | "db" | "event"
  weight: number
}

export interface KnowledgeNode {
  id: string
  label: string
  type: "module" | "class" | "function" | "interface" | "file"
  x: number
  y: number
  size: number
  color: string
  connections: number
  description: string
}

export interface KnowledgeEdge {
  source: string
  target: string
  label: string
}

export interface SecurityFinding {
  id: string
  severity: "critical" | "high" | "medium" | "low"
  title: string
  location: string
  line: number
  description: string
  recommendation: string
  category: string
  expanded?: boolean
}

export interface Metric {
  label: string
  value: number
  unit: string
  trend: "up" | "down" | "stable"
  color: string
  description: string
}

export interface AgentStatus {
  id: string
  name: string
  description: string
  status: "queued" | "running" | "complete" | "analyzing"
  progress: number
  findings: number
  icon: string
  color: string
}

export interface AnalysisPhase {
  id: string
  label: string
  description: string
  duration: number // ms
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

export const PRESET_REPOS = [
  "vercel/next.js",
  "facebook/react",
  "microsoft/vscode",
  "torvalds/linux",
  "django/django",
]

export function getMockRepoMeta(repoUrl: string): RepoMeta {
  const slug = repoUrl.replace("https://github.com/", "").replace(/\/$/, "")
  const presets: Record<string, RepoMeta> = {
    "vercel/next.js": {
      owner: "vercel", name: "next.js", fullName: "vercel/next.js",
      description: "The React Framework for the Web", language: "TypeScript",
      stars: 124800, forks: 26400, openIssues: 2840, lastCommit: "2 hours ago", defaultBranch: "canary",
    },
    "facebook/react": {
      owner: "facebook", name: "react", fullName: "facebook/react",
      description: "The library for web and native user interfaces", language: "JavaScript",
      stars: 228000, forks: 46700, openIssues: 1204, lastCommit: "4 hours ago", defaultBranch: "main",
    },
    "microsoft/vscode": {
      owner: "microsoft", name: "vscode", fullName: "microsoft/vscode",
      description: "Visual Studio Code", language: "TypeScript",
      stars: 165000, forks: 29200, openIssues: 8740, lastCommit: "1 hour ago", defaultBranch: "main",
    },
  }
  return presets[slug] ?? {
    owner: slug.split("/")[0] ?? "owner",
    name: slug.split("/")[1] ?? "repo",
    fullName: slug,
    description: "A software repository",
    language: "TypeScript", stars: 4200, forks: 890,
    openIssues: 112, lastCommit: "3 days ago", defaultBranch: "main",
  }
}

export const ANALYSIS_PHASES: AnalysisPhase[] = [
  { id: "connect",    label: "Connecting to Repository", description: "Authenticating and fetching repository metadata", duration: 900 },
  { id: "scan",       label: "Scanning File Structure",  description: "Traversing directory tree and indexing source files", duration: 1400 },
  { id: "ast",        label: "AST Parsing",              description: "Parsing source files into abstract syntax trees", duration: 1800 },
  { id: "deps",       label: "Dependency Analysis",      description: "Resolving import chains and module relationships", duration: 1600 },
  { id: "graph",      label: "Building Knowledge Graph", description: "Linking entities, relationships and embeddings", duration: 1400 },
  { id: "agents",     label: "Running AI Agents",        description: "Dispatching specialized agents for analysis", duration: 2200 },
  { id: "complete",   label: "Generating Intelligence",  description: "Synthesising insights and risk models", duration: 800 },
]

export const INITIAL_AGENTS: AgentStatus[] = [
  { id: "repo-understand", name: "Repository Understanding", description: "Building structural model", status: "queued", progress: 0, findings: 0, icon: "⬡", color: "#8b5cf6" },
  { id: "architecture",    name: "Architecture Recovery",    description: "Detecting architectural patterns", status: "queued", progress: 0, findings: 0, icon: "◈", color: "#a78bfa" },
  { id: "dependency",      name: "Dependency Analysis",      description: "Mapping module dependencies", status: "queued", progress: 0, findings: 0, icon: "⬟", color: "#06b6d4" },
  { id: "knowledge-graph", name: "Knowledge Graph",          description: "Building entity relationships", status: "queued", progress: 0, findings: 0, icon: "◻", color: "#0ea5e9" },
  { id: "code-quality",    name: "Code Quality",             description: "Measuring complexity & coupling", status: "queued", progress: 0, findings: 0, icon: "⬡", color: "#34d399" },
  { id: "security",        name: "Security Analysis",        description: "Scanning for vulnerabilities", status: "queued", progress: 0, findings: 0, icon: "◈", color: "#f472b6" },
  { id: "bug-risk",        name: "Bug Risk Prediction",      description: "Predicting defect-prone modules", status: "queued", progress: 0, findings: 0, icon: "⬟", color: "#fbbf24" },
  { id: "docs",            name: "Documentation Agent",      description: "Extracting documentation signals", status: "queued", progress: 0, findings: 0, icon: "◻", color: "#fb923c" },
  { id: "chat",            name: "Repository Chat Agent",    description: "Indexing for conversational RAG", status: "queued", progress: 0, findings: 0, icon: "⬡", color: "#c4b5fd" },
]

export const MOCK_FILE_TREE: FileNode = {
  id: "root", name: "vercel/next.js", path: "/", type: "dir",
  children: [
    {
      id: "packages", name: "packages", path: "/packages", type: "dir",
      children: [
        { id: "next", name: "next", path: "/packages/next", type: "dir", children: [
          { id: "src", name: "src", path: "/packages/next/src", type: "dir", children: [
            { id: "client", name: "client", path: "/packages/next/src/client", type: "dir", children: [
              { id: "app-dir", name: "app", path: ".../client/app", type: "dir", children: [
                { id: "link-tsx", name: "link.tsx", path: ".../app/link.tsx", type: "file", language: "tsx", lines: 284, complexity: 12 },
                { id: "image-tsx", name: "image.tsx", path: ".../app/image.tsx", type: "file", language: "tsx", lines: 541, complexity: 21 },
                { id: "router-tsx", name: "router.tsx", path: ".../app/router.tsx", type: "file", language: "tsx", lines: 189, complexity: 9 },
              ]},
              { id: "components-tsx", name: "components.tsx", path: ".../client/components.tsx", type: "file", language: "tsx", lines: 872, complexity: 34 },
            ]},
            { id: "server", name: "server", path: "/packages/next/src/server", type: "dir", children: [
              { id: "app-router", name: "app-router", path: ".../server/app-router", type: "dir", children: [
                { id: "action-handler", name: "action-handler.ts", path: ".../action-handler.ts", type: "file", language: "ts", lines: 620, complexity: 28 },
                { id: "router-server", name: "router-server.ts", path: ".../router-server.ts", type: "file", language: "ts", lines: 890, complexity: 41 },
              ]},
              { id: "next-server", name: "next-server.ts", path: ".../server/next-server.ts", type: "file", language: "ts", lines: 1204, complexity: 62 },
              { id: "render-result", name: "render-result.ts", path: ".../server/render-result.ts", type: "file", language: "ts", lines: 380, complexity: 16 },
            ]},
            { id: "build", name: "build", path: "/packages/next/src/build", type: "dir", children: [
              { id: "webpack-cfg", name: "webpack-config.ts", path: ".../build/webpack-config.ts", type: "file", language: "ts", lines: 2140, complexity: 88 },
              { id: "compiler", name: "compiler.ts", path: ".../build/compiler.ts", type: "file", language: "ts", lines: 760, complexity: 32 },
            ]},
          ]},
        ]},
        { id: "font", name: "font", path: "/packages/font", type: "dir", children: [
          { id: "font-index", name: "index.ts", path: ".../font/index.ts", type: "file", language: "ts", lines: 140, complexity: 6 },
        ]},
      ],
    },
    { id: "examples", name: "examples", path: "/examples", type: "dir", children: [
      { id: "with-ts", name: "with-typescript", path: "/examples/with-typescript", type: "dir", children: [] },
    ]},
    { id: "test", name: "test", path: "/test", type: "dir", children: [
      { id: "e2e", name: "e2e", path: "/test/e2e", type: "dir", children: [
        { id: "app-dir-test", name: "app-dir", path: "/test/e2e/app-dir", type: "dir", children: [] },
      ]},
    ]},
    { id: "package-json", name: "package.json", path: "/package.json", type: "file", language: "json", lines: 42 },
    { id: "readme-md", name: "README.md", path: "/README.md", type: "file", language: "md", lines: 280 },
    { id: "turbo-json", name: "turbo.json", path: "/turbo.json", type: "file", language: "json", lines: 88 },
  ],
}

export const ARCH_NODES: ArchNode[] = [
  { id: "cli",       label: "CLI Layer",       layer: "ui",      x: 300, y: 60,  files: 18,  complexity: 24, description: "next CLI commands: dev, build, start, export" },
  { id: "router",    label: "App Router",      layer: "api",     x: 180, y: 160, files: 46,  complexity: 78, description: "File-system-based App Router with RSC support" },
  { id: "pages",     label: "Pages Router",    layer: "api",     x: 420, y: 160, files: 32,  complexity: 55, description: "Legacy pages/ directory routing" },
  { id: "server",    label: "Next Server",     layer: "service", x: 180, y: 270, files: 84,  complexity: 142, description: "HTTP server, SSR, streaming, middleware" },
  { id: "compiler",  label: "Compiler/Build",  layer: "service", x: 420, y: 270, files: 61,  complexity: 118, description: "Webpack config, SWC transforms, bundling" },
  { id: "cache",     label: "Cache Manager",   layer: "data",    x: 120, y: 380, files: 14,  complexity: 31, description: "Full Route Cache, Data Cache, Router Cache" },
  { id: "rsc",       label: "RSC Runtime",     layer: "data",    x: 300, y: 380, files: 28,  complexity: 64, description: "React Server Components runtime layer" },
  { id: "edge",      label: "Edge Runtime",    layer: "infra",   x: 480, y: 380, files: 22,  complexity: 44, description: "Vercel Edge / Cloudflare Workers target" },
  { id: "utils",     label: "Shared Utils",    layer: "util",    x: 300, y: 480, files: 39,  complexity: 28, description: "Utilities, constants, type helpers" },
]

export const ARCH_EDGES: ArchEdge[] = [
  { id: "e1",  source: "cli",      target: "router",   type: "import", weight: 3 },
  { id: "e2",  source: "cli",      target: "pages",    type: "import", weight: 2 },
  { id: "e3",  source: "cli",      target: "compiler", type: "import", weight: 4 },
  { id: "e4",  source: "router",   target: "server",   type: "api",    weight: 5 },
  { id: "e5",  source: "pages",    target: "server",   type: "api",    weight: 4 },
  { id: "e6",  source: "server",   target: "cache",    type: "db",     weight: 3 },
  { id: "e7",  source: "server",   target: "rsc",      type: "import", weight: 5 },
  { id: "e8",  source: "compiler", target: "edge",     type: "import", weight: 3 },
  { id: "e9",  source: "rsc",      target: "utils",    type: "import", weight: 2 },
  { id: "e10", source: "cache",    target: "utils",    type: "import", weight: 2 },
  { id: "e11", source: "edge",     target: "utils",    type: "import", weight: 2 },
  { id: "e12", source: "router",   target: "rsc",      type: "event",  weight: 4 },
]

export const KNOWLEDGE_NODES: KnowledgeNode[] = [
  { id: "NextServer",      label: "NextServer",       type: "class",     x: 300, y: 200, size: 22, color: "#8b5cf6", connections: 14, description: "Core HTTP server class handling SSR and routing" },
  { id: "AppRouter",       label: "AppRouter",        type: "class",     x: 180, y: 120, size: 18, color: "#a78bfa", connections: 11, description: "App directory router with RSC streaming" },
  { id: "PagesRouter",     label: "PagesRouter",      type: "class",     x: 420, y: 120, size: 16, color: "#a78bfa", connections: 9,  description: "Legacy pages/ router implementation" },
  { id: "RouteHandler",    label: "RouteHandler",     type: "class",     x: 160, y: 220, size: 14, color: "#06b6d4", connections: 8,  description: "Individual route handling and matching" },
  { id: "RenderResult",    label: "RenderResult",     type: "class",     x: 300, y: 300, size: 14, color: "#06b6d4", connections: 7,  description: "Encapsulates a rendered page response" },
  { id: "ActionHandler",   label: "ActionHandler",    type: "module",    x: 440, y: 220, size: 13, color: "#34d399", connections: 6,  description: "Server Actions handling and mutation" },
  { id: "WebpackConfig",   label: "WebpackConfig",    type: "module",    x: 480, y: 300, size: 15, color: "#fbbf24", connections: 10, description: "Complex webpack configuration builder" },
  { id: "CacheManager",    label: "CacheManager",     type: "class",     x: 200, y: 310, size: 13, color: "#0ea5e9", connections: 8,  description: "Multi-layer caching: route, data, router" },
  { id: "RSCPayload",      label: "RSCPayload",       type: "interface", x: 340, y: 150, size: 11, color: "#c4b5fd", connections: 5,  description: "React Server Component payload type" },
  { id: "EdgeRuntime",     label: "EdgeRuntime",      type: "module",    x: 420, y: 330, size: 12, color: "#fb923c", connections: 5,  description: "Edge-compatible runtime target" },
  { id: "ImageOptimizer",  label: "ImageOptimizer",   type: "class",     x: 120, y: 310, size: 12, color: "#f472b6", connections: 4,  description: "Automatic image optimization pipeline" },
  { id: "Middleware",      label: "Middleware",        type: "function",  x: 240, y: 60,  size: 11, color: "#67e8f9", connections: 6,  description: "Edge middleware request/response hooks" },
  { id: "useRouter",       label: "useRouter()",      type: "function",  x: 140, y: 170, size: 10, color: "#34d399", connections: 3,  description: "Client hook for programmatic navigation" },
  { id: "Link",            label: "<Link />",          type: "class",     x: 100, y: 240, size: 10, color: "#8b5cf6", connections: 3,  description: "Prefetching anchor component" },
]

export const KNOWLEDGE_EDGES: KnowledgeEdge[] = [
  { source: "NextServer",    target: "AppRouter",      label: "manages" },
  { source: "NextServer",    target: "PagesRouter",    label: "manages" },
  { source: "NextServer",    target: "RenderResult",   label: "produces" },
  { source: "NextServer",    target: "CacheManager",   label: "uses" },
  { source: "AppRouter",     target: "RouteHandler",   label: "creates" },
  { source: "AppRouter",     target: "RSCPayload",     label: "emits" },
  { source: "PagesRouter",   target: "RouteHandler",   label: "creates" },
  { source: "RouteHandler",  target: "RenderResult",   label: "returns" },
  { source: "ActionHandler", target: "NextServer",     label: "registered in" },
  { source: "WebpackConfig", target: "EdgeRuntime",    label: "targets" },
  { source: "CacheManager",  target: "RenderResult",   label: "caches" },
  { source: "Middleware",    target: "RouteHandler",   label: "intercepts" },
  { source: "useRouter",     target: "AppRouter",      label: "connects" },
  { source: "Link",          target: "AppRouter",      label: "triggers" },
  { source: "ImageOptimizer",target: "NextServer",     label: "registered in" },
  { source: "RSCPayload",    target: "RenderResult",   label: "serialized into" },
]

export const SECURITY_FINDINGS: SecurityFinding[] = [
  {
    id: "sec-001", severity: "critical", category: "Prototype Pollution",
    title: "Prototype pollution in query parser",
    location: "packages/next/src/server/api-utils/node/parse-body.ts",
    line: 84,
    description: "User-controlled input is merged into an object without prototype chain sanitization, potentially allowing prototype pollution attacks.",
    recommendation: "Use Object.create(null) for query objects or validate with a strict allow-list. Consider using the `qs` library with `allowProtoKeys: false`.",
  },
  {
    id: "sec-002", severity: "high", category: "Path Traversal",
    title: "Unsanitized file path in static file handler",
    location: "packages/next/src/server/serve-static.ts",
    line: 142,
    description: "File path constructed from user input without proper sanitization could allow directory traversal attacks outside the public directory.",
    recommendation: "Use `path.resolve` with an explicit base and verify the resolved path begins with the expected root before serving.",
  },
  {
    id: "sec-003", severity: "high", category: "ReDoS",
    title: "Regular expression denial of service",
    location: "packages/next/src/shared/lib/router/utils/route-regex.ts",
    line: 58,
    description: "Complex regex with unbounded quantifiers on user-supplied URL inputs may cause catastrophic backtracking.",
    recommendation: "Bound all quantifiers and add an early-exit length check on input strings before applying the pattern.",
  },
  {
    id: "sec-004", severity: "medium", category: "Information Disclosure",
    title: "Stack traces exposed in development error overlay",
    location: "packages/next/src/client/components/react-dev-overlay/",
    line: 0,
    description: "Development error overlay may expose stack traces and source maps in non-development builds if NODE_ENV is not set correctly.",
    recommendation: "Conditionally compile the overlay only for development builds. Add a build-time assertion to strip the component.",
  },
  {
    id: "sec-005", severity: "medium", category: "CSRF",
    title: "Missing CSRF validation on Server Actions",
    location: "packages/next/src/server/app-render/action-handler.ts",
    line: 317,
    description: "Server Actions triggered via fetch() do not validate the Origin header against the allowed list in all code paths.",
    recommendation: "Ensure every Server Action handler checks `request.headers.get('origin')` against the expected origin before processing mutations.",
  },
  {
    id: "sec-006", severity: "low", category: "Dependency",
    title: "Outdated dependency with known CVE",
    location: "package.json → postcss@8.4.21",
    line: 0,
    description: "postcss 8.4.21 is affected by CVE-2023-44270 (line parsing vulnerability). The fix is available in 8.4.31+.",
    recommendation: "Update postcss to ^8.4.31 in package.json and verify no peer dependency conflicts.",
  },
  {
    id: "sec-007", severity: "low", category: "Headers",
    title: "Missing security headers in default config",
    location: "packages/next/src/server/config.ts",
    line: 201,
    description: "Default security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) are not applied unless explicitly configured.",
    recommendation: "Enable secure headers by default in next.config.js and document opt-out rather than opt-in.",
  },
]

export const METRICS: Metric[] = [
  { label: "Health Score",      value: 74, unit: "/100",  trend: "up",   color: "#34d399", description: "Overall codebase health composite" },
  { label: "Avg Complexity",    value: 42, unit: "",       trend: "down", color: "#fbbf24", description: "Average cyclomatic complexity per function" },
  { label: "Test Coverage",     value: 58, unit: "%",      trend: "up",   color: "#06b6d4", description: "Line coverage across test suites" },
  { label: "Documentation",     value: 61, unit: "%",      trend: "stable", color: "#a78bfa", description: "Functions with JSDoc/TSDoc coverage" },
  { label: "Coupling Index",    value: 38, unit: "/100",   trend: "down", color: "#f472b6", description: "Average afferent + efferent coupling" },
  { label: "Duplication",       value: 12, unit: "%",      trend: "stable", color: "#fb923c", description: "Code duplication detected by AST" },
]

