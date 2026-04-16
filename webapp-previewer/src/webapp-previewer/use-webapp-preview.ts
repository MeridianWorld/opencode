import { createEffect, createMemo, createSignal, onCleanup } from "solid-js"
import { useSync } from "@/context/sync"
import type { DetectedFile, DeviceMode, WebAppPreviewConfig, WebAppPreviewState } from "./types"

const DEFAULT_STATE: WebAppPreviewState = {
  isOpen: false,
  filePath: null,
  previewUrl: null,
  deviceMode: "desktop",
  detectedFiles: [],
  autoPreview: true,
}

const WEB_APP_EXTENSIONS = [".html", ".htm"]

const isAbsolute = (value: string) => /^[A-Za-z]:[\\/]/.test(value)
const slash = (value: string) => value.replace(/\\/g, "/")
const trim = (value: string) => slash(value).replace(/\/+$/, "")
const lead = (value: string) => slash(value).replace(/^\/+/, "")

export function locate(dir: string, value: string) {
  const root = trim(dir)
  const path = isAbsolute(value) ? slash(value) : `${root}/${lead(value)}`
  return {
    path,
    relative: path.startsWith(`${root}/`) ? path.slice(root.length + 1) : path,
  }
}

export function href(base: string, dir: string, file: string) {
  return `${base.replace(/\/$/, "")}/view/${locate(dir, file).relative}?directory=${encodeURIComponent(dir)}`
}

export function useWebAppPreview(initialConfig?: Partial<WebAppPreviewConfig>) {
  const sync = useSync()
  const [state, setState] = createSignal<WebAppPreviewState>({
    ...DEFAULT_STATE,
    ...initialConfig,
  })
  const [config, setConfig] = createSignal<WebAppPreviewConfig>({
    backendUrl: "http://localhost:4096",
    projectDirectory: sync.directory || "",
    autoPreview: true,
    ...initialConfig,
  })

  createEffect(() => {
    const dir = sync.directory
    if (!dir || dir === config().projectDirectory) return
    setConfig((prev) => ({
      ...prev,
      projectDirectory: dir,
    }))
    setState((prev) => ({
      ...prev,
      filePath: null,
      previewUrl: null,
      isOpen: false,
    }))
  })

  const isWebAppFile = (filePath: string) => WEB_APP_EXTENSIONS.some((ext) => filePath.toLowerCase().endsWith(ext))

  const detectWebAppFiles = createMemo(() => {
    const directory = sync.directory || config().projectDirectory
    if (!directory) return [] as DetectedFile[]

    const seen = new Set<string>()
    const files: DetectedFile[] = []
    const add = (value: string, active: boolean) => {
      const next = locate(directory, value)
      if (!isWebAppFile(next.path) || seen.has(next.path)) return
      seen.add(next.path)
      files.push({
        path: next.path,
        relativePath: next.relative,
        name: next.path.split("/").pop() || next.path,
        type: "html",
        lastModified: Date.now(),
        isActive: active,
      })
    }

    Object.values(sync.data.session_diff)
      .flat()
      .forEach((diff) => {
        if (!diff?.file) return
        add(diff.file, true)
      })

    ;[
      "index.html",
      "app.html",
      "main.html",
      "public/index.html",
      "dist/index.html",
      "build/index.html",
      "src/index.html",
    ].forEach((value) => add(value, false))

    return files
  })

  const generatePreviewUrl = (filePath: string) => {
    const directory = sync.directory || config().projectDirectory
    return href(config().backendUrl, directory, filePath)
  }

  const injectBaseTag = async (htmlUrl: string, directory: string) => {
    try {
      const response = await fetch(htmlUrl)
      const html = await response.text()
      const baseUrl = config().backendUrl.replace(/\/$/, "")
      const baseHref = `${baseUrl}/view/?directory=${encodeURIComponent(directory)}`
      const baseTag = `<base href="${baseHref}">`
      let modifiedHtml = html.replace("<head>", `<head>\n    ${baseTag}`)
      const replace = (attr: "href" | "src", tag: "link" | "script" | "img") =>
        new RegExp(`<${tag}([^>]*?)\\s+${attr}=[\"']?(?!https?:\\/\\/|\\/|#)([^\"'\\s>]+)[\"']?([^>]*?)>`, "gi")
      const suffix = `?directory=${encodeURIComponent(directory)}`

      modifiedHtml = modifiedHtml.replace(replace("href", "link"), `<link$1 href="${baseUrl}/view/$2${suffix}"$3>`)
      modifiedHtml = modifiedHtml.replace(
        replace("src", "script"),
        `<script$1 src="${baseUrl}/view/$2${suffix}"$3>`,
      )
      modifiedHtml = modifiedHtml.replace(replace("src", "img"), `<img$1 src="${baseUrl}/view/$2${suffix}"$3>`)
      if (!modifiedHtml.includes("<base")) return htmlUrl
      return URL.createObjectURL(new Blob([modifiedHtml], { type: "text/html" }))
    } catch {
      return htmlUrl
    }
  }

  const openPreview = async (filePath?: string) => {
    const targetFile = filePath || detectWebAppFiles().find((file) => file.isActive)?.path || detectWebAppFiles()[0]?.path
    if (!targetFile) return
    const previewUrl = generatePreviewUrl(targetFile)

    try {
      const response = await fetch(previewUrl, { method: "HEAD" })
      if (!response.ok || response.status !== 200) return
    } catch {
      return
    }

    const directory = sync.directory || config().projectDirectory
    const finalPreviewUrl = await injectBaseTag(previewUrl, directory)
    setState((prev) => ({
      ...prev,
      isOpen: true,
      filePath: targetFile,
      previewUrl: finalPreviewUrl,
    }))
  }

  const closePreview = () => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
    }))
  }

  const togglePreview = () => {
    setState((prev) => ({
      ...prev,
      isOpen: !prev.isOpen,
    }))
  }

  const setDeviceMode = (mode: DeviceMode) => {
    setState((prev) => ({
      ...prev,
      deviceMode: mode,
    }))
  }

  const setAutoPreview = (enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      autoPreview: enabled,
    }))
    setConfig((prev) => ({
      ...prev,
      autoPreview: enabled,
    }))
  }

  const updateConfig = (next: Partial<WebAppPreviewConfig>) => {
    setConfig((prev) => ({
      ...prev,
      ...next,
    }))
  }

  createEffect(() => {
    const files = detectWebAppFiles()
    if (!config().autoPreview || files.length === 0) return
    const file = files.find((item) => item.isActive) || files[0]
    if (!file) return
    if (state().filePath === file.path) return
    setTimeout(() => {
      void openPreview(file.path)
    }, 100)
  })

  createEffect(() => {
    const files = detectWebAppFiles()
    if (files.length === 0 || !config().autoPreview || state().isOpen || state().filePath) return
    setTimeout(() => {
      if (state().isOpen) return
      void openPreview()
    }, 500)
  })

  onCleanup(() => {})

  return {
    state,
    config,
    openPreview,
    closePreview,
    togglePreview,
    setDeviceMode,
    setAutoPreview,
    updateConfig,
    isWebAppFile,
    generatePreviewUrl,
    detectedFiles: detectWebAppFiles,
  }
}
