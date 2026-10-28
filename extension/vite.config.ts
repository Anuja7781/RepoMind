import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig, loadEnv, type Plugin } from "vite"
import react from "@vitejs/plugin-react"

const extensionRoot = fileURLToPath(new URL(".", import.meta.url))

function resolveBackendUrl(value: string): URL {
  let backendUrl: URL
  try {
    backendUrl = new URL(value)
  } catch {
    throw new Error("VITE_BACKEND_URL must be an absolute backend origin.")
  }

  const isLoopback = ["localhost", "127.0.0.1", "[::1]"].includes(backendUrl.hostname)
  if (
    (backendUrl.protocol !== "https:" && !(backendUrl.protocol === "http:" && isLoopback)) ||
    backendUrl.username ||
    backendUrl.password ||
    backendUrl.pathname !== "/" ||
    backendUrl.search ||
    backendUrl.hash
  ) {
    throw new Error("VITE_BACKEND_URL must be an HTTPS origin or an HTTP loopback origin, without credentials or a path.")
  }
  return backendUrl
}

function validateDashboardUrl(value: string): void {
  let dashboardUrl: URL
  try {
    dashboardUrl = new URL(value)
  } catch {
    throw new Error("VITE_DASHBOARD_URL must be an absolute dashboard URL.")
  }

  const isLoopback = ["localhost", "127.0.0.1", "[::1]"].includes(dashboardUrl.hostname)
  if (
    (dashboardUrl.protocol !== "https:" && !(dashboardUrl.protocol === "http:" && isLoopback)) ||
    dashboardUrl.username ||
    dashboardUrl.password ||
    dashboardUrl.search ||
    dashboardUrl.hash
  ) {
    throw new Error("VITE_DASHBOARD_URL must use HTTPS or a loopback HTTP host, without credentials, query, or fragment.")
  }
}

function extensionManifest(backendOrigin: string): Plugin {
  return {
    name: "repomind-extension-manifest",
    closeBundle() {
      const source = resolve(extensionRoot, "public/manifest.json")
      const output = resolve(extensionRoot, "dist/manifest.json")
      const manifest = JSON.parse(readFileSync(source, "utf8")) as Record<string, unknown>
      manifest.host_permissions = [`${backendOrigin}/*`]
      writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`)
    },
  }
}

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, extensionRoot, "")
  const backendUrl = resolveBackendUrl(environment.VITE_BACKEND_URL || "http://127.0.0.1:8000")
  const dashboardUrl = environment.VITE_DASHBOARD_URL || "http://localhost:8443"
  validateDashboardUrl(dashboardUrl)

  return {
    base: "./",
    plugins: [react(), extensionManifest(backendUrl.origin)],
    define: {
      "import.meta.env.VITE_DASHBOARD_URL": JSON.stringify(dashboardUrl),
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      rollupOptions: {
        input: {
          popup: resolve(extensionRoot, "index.html"),
          background: resolve(extensionRoot, "src/background.ts"),
          content: resolve(extensionRoot, "src/content.ts"),
        },
        output: {
          entryFileNames: chunk => `${chunk.name}.js`,
          chunkFileNames: "chunks/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]",
        },
      },
    },
  }
})
