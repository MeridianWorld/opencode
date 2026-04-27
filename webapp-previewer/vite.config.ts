import { defineConfig } from "vite"
import desktopPlugin from "./vite"
import path from "path"

export default defineConfig({
  plugins: [desktopPlugin] as any,
  define: {
    "import.meta.env.VITE_OPENCODE_ATOMS_DEMO_DIR": JSON.stringify(path.resolve(__dirname, "../test-html")),
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    port: 3000,
    fs: {
      // Allow serving files from parent directories
      allow: [".."],
    },
    // Add proxy for project files
    proxy: {
      "/project": {
        target: "http://localhost:4096",
        rewrite: (path) => path.replace(/^\/project/, ""),
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            // Proxy to backend's file serving endpoint
            const originalPath = req.url
            proxyReq.path = `/view/?directory=d:/github_repo/opencode&file=d:/github_repo/opencode${originalPath.replace("/project", "")}`
          })
        },
      },
    },
  },
  build: {
    target: "esnext",
    // sourcemap: true,
  },
})
