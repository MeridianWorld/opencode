/**
 * Hook for managing web app preview state
 */

import { createSignal, createMemo, createEffect, onCleanup, createResource } from "solid-js"
import { useSDK } from "@/context/sdk"
import { useSync } from "@/context/sync"
import type { WebAppPreviewState, DetectedFile, DeviceMode, WebAppPreviewConfig } from "./types"

const DEFAULT_STATE: WebAppPreviewState = {
  isOpen: false,
  filePath: null,
  previewUrl: null,
  deviceMode: "desktop",
  detectedFiles: [],
  autoPreview: true,
}

const WEB_APP_EXTENSIONS = [".html", ".htm"]

export function useWebAppPreview(initialConfig?: Partial<WebAppPreviewConfig>) {
  const sdk = useSDK()
  const sync = useSync()
  
  // Get the current project directory from sync context (session-specific)
  const projectDir = sync.directory || "C:/Users/Administrator/新建文件夹"
  
  // Log sync directory changes
  createEffect(() => {
    const dir = sync.directory
    console.log('[WebAppPreview] Sync directory changed:', dir)
  })
  
  const [state, setState] = createSignal<WebAppPreviewState>({
    ...DEFAULT_STATE,
    ...initialConfig,
  })

  const [config, setConfig] = createSignal<WebAppPreviewConfig>({
    backendUrl: "http://localhost:4096",
    projectDirectory: projectDir,
    autoPreview: true,
    ...initialConfig,
  })

  // Update project directory when sync context changes
  createEffect(() => {
    const newDir = sync.directory
    if (newDir && newDir !== config().projectDirectory) {
      console.log('[WebAppPreview] Project directory changed:', newDir)
      setConfig(prev => ({
        ...prev,
        projectDirectory: newDir,
      }))
      // Reset preview state when directory changes
      setState(prev => ({
        ...prev,
        filePath: null,
        previewUrl: null,
        isOpen: false,
      }))
      console.log('[WebAppPreview] Reset preview state due to directory change')
    }
  })

  // Detect web application files from session diffs and existing files
  const detectWebAppFiles = createMemo(() => {
    // Use sync.directory directly (session-specific directory)
    const directory = sync.directory || projectDir
    console.log('[WebAppPreview] Detecting files in directory:', directory)
    if (!directory) return []

    const files: DetectedFile[] = []
    const seenPaths = new Set<string>()

    // Method 1: Try to get files from SDK session diffs (newly generated files)
    try {
      // Check if queryClient exists
      if (sdk.queryClient) {
        const state = sdk.queryClient.getQueryState(["/session/get", { id: sdk.session?.id }])
        const session = state?.data as any
        
        // console.log('[WebAppPreview] Session state:', session ? 'found' : 'not found')
        // console.log('[WebAppPreview] Session ID:', sdk.session?.id)
        
        if (session?.diffs) {
          // console.log('[WebAppPreview] Found diffs:', session.diffs.length)
          for (const diff of session.diffs) {
            if (diff.path && isWebAppFile(diff.path) && !seenPaths.has(diff.path)) {
              seenPaths.add(diff.path)
              files.push({
                path: diff.path,
                relativePath: diff.path.replace(directory + "/", ""),
                name: diff.path.split("/").pop() || diff.path,
                type: "html",
                lastModified: Date.now(),
                isActive: diff.status === "added" || diff.status === "modified",
              })
            }
          }
        }
      } else {
        console.warn('[WebAppPreview] SDK queryClient not ready yet, skipping session diffs')
      }
    } catch (error) {
      console.warn("[WebAppPreview] Failed to detect web app files from session:", error)
    }

    // Method 2: Check for HTML files in the current project directory
    // Note: We add these paths but they will be validated when opening preview
    try {
      const knownHtmlPaths = [
        "index.html",
        "app.html",
        "main.html",
        "public/index.html",
        "dist/index.html",
        "build/index.html",
        "src/index.html",
      ]
      
      for (const htmlPath of knownHtmlPaths) {
        const fullPath = `${directory}/${htmlPath}`
        if (!seenPaths.has(fullPath)) {
          seenPaths.add(fullPath)
          files.push({
            path: fullPath,
            relativePath: htmlPath,
            name: htmlPath.split("/").pop() || htmlPath,
            type: "html",
            lastModified: Date.now(),
            isActive: false,
          })
        }
      }
    } catch (error) {
      console.warn("[WebAppPreview] Failed to check known paths:", error)
    }

    // console.log('[WebAppPreview] Detected files:', files.length, files)
    return files
  })

  // Generate preview URL for a file
  const generatePreviewUrl = (filePath: string) => {
    // Use sync.directory directly (session-specific directory)
    const directory = sync.directory || projectDir
    
    // Get relative path from project directory
    const relativePath = filePath.replace(directory + "/", "")
    
    // Use backend's /view/ endpoint to serve the file
    // The backend will serve the actual file content
    const cfg = config()
    const baseUrl = cfg.backendUrl.replace(/\/$/, "") // Remove trailing slash
    
    // Add directory query parameter so backend knows which directory to serve from
    // This directory parameter will be used for all resource requests (CSS, JS, etc.)
    return `${baseUrl}/view/${relativePath}?directory=${encodeURIComponent(directory)}`
  }
  
  // Inject base tag into HTML to fix relative resource paths
  const injectBaseTag = async (htmlUrl: string, directory: string) => {
    try {
      const response = await fetch(htmlUrl)
      const html = await response.text()
      
      // Create a base tag that points to the /view/ endpoint with directory parameter
      const baseUrl = config().backendUrl.replace(/\/$/, "")
      const baseHref = `${baseUrl}/view/?directory=${encodeURIComponent(directory)}`
      const baseTag = `<base href="${baseHref}">`
      
      console.log('[WebAppPreview] Injecting base tag:', baseHref)
      
      // Inject base tag after <head> tag
      let modifiedHtml = html.replace('<head>', `<head>\n    ${baseTag}`)
      
      // Also need to fix paths in link, script, img tags that don't start with http or /
      // Replace relative paths with absolute paths including directory parameter
      const baseUrlForResources = `${baseUrl}/view/`
      
      // Fix href attributes in link tags (for CSS)
      modifiedHtml = modifiedHtml.replace(
        /<link([^>]*?)\s+href=["']?(?!https?:\/\/|\/|#)([^"'\s>]+)["']?([^>]*?)>/gi,
        `<link$1 href="${baseUrlForResources}$2?directory=${encodeURIComponent(directory)}"$3>`
      )
      
      // Fix src attributes in script tags
      modifiedHtml = modifiedHtml.replace(
        /<script([^>]*?)\s+src=["']?(?!https?:\/\/|\/|#)([^"'\s>]+)["']?([^>]*?)>/gi,
        `<script$1 src="${baseUrlForResources}$2?directory=${encodeURIComponent(directory)}"$3>`
      )
      
      // Fix src attributes in img tags
      modifiedHtml = modifiedHtml.replace(
        /<img([^>]*?)\s+src=["']?(?!https?:\/\/|\/|#)([^"'\s>]+)["']?([^>]*?)>/gi,
        `<img$1 src="${baseUrlForResources}$2?directory=${encodeURIComponent(directory)}"$3>`
      )
      
      // Verify base tag was injected
      if (!modifiedHtml.includes('<base')) {
        console.error('[WebAppPreview] Failed to inject base tag!')
        return htmlUrl
      }
      
      // Create a blob URL for the modified HTML
      const blob = new Blob([modifiedHtml], { type: 'text/html' })
      const blobUrl = URL.createObjectURL(blob)
      console.log('[WebAppPreview] Created blob URL:', blobUrl)
      
      return blobUrl
    } catch (error) {
      console.error('[WebAppPreview] Failed to inject base tag:', error)
      return htmlUrl // Fallback to original URL
    }
  }

  // Check if a file is a web application file
  const isWebAppFile = (filePath: string) => {
    const ext = filePath.toLowerCase()
    return WEB_APP_EXTENSIONS.some(e => ext.endsWith(e))
  }

  // Open preview panel
  const openPreview = async (filePath?: string) => {
    const files = detectWebAppFiles()
    const targetFile = filePath || files.find(f => isWebAppFile(f.path))?.path
    
    if (targetFile) {
      // Validate that the file exists by checking the backend response
      const previewUrl = generatePreviewUrl(targetFile)
      try {
        const response = await fetch(previewUrl, { method: 'HEAD' })
        if (!response.ok || response.status !== 200) {
          // File doesn't exist, don't open preview
          console.warn('[WebAppPreview] File does not exist:', targetFile)
          return
        }
      } catch (error) {
        console.warn('[WebAppPreview] Failed to validate file:', targetFile, error)
        return
      }
      
      // Inject base tag to fix relative resource paths
      const directory = sync.directory || projectDir
      const finalPreviewUrl = await injectBaseTag(previewUrl, directory)
      
      setState(prev => ({
        ...prev,
        isOpen: true,
        filePath: targetFile,
        previewUrl: finalPreviewUrl,
      }))
    }
  }

  // Close preview panel
  const closePreview = () => {
    setState(prev => ({
      ...prev,
      isOpen: false,
    }))
  }

  // Toggle preview panel
  const togglePreview = () => {
    setState(prev => ({
      ...prev,
      isOpen: !prev.isOpen,
    }))
  }

  // Set device mode
  const setDeviceMode = (mode: DeviceMode) => {
    setState(prev => ({
      ...prev,
      deviceMode: mode,
    }))
  }

  // Set auto-preview
  const setAutoPreview = (enabled: boolean) => {
    setState(prev => ({
      ...prev,
      autoPreview: enabled,
    }))
    setConfig(prev => ({
      ...prev,
      autoPreview: enabled,
    }))
  }

  // Update config
  const updateConfig = (newConfig: Partial<WebAppPreviewConfig>) => {
    setConfig(prev => ({
      ...prev,
      ...newConfig,
    }))
  }

  // Auto-detect and preview when files change
  createEffect(() => {
    const files = detectWebAppFiles()
    const cfg = config()
    
    if (cfg.autoPreview && files.length > 0) {
      // Prioritize newly generated files (isActive = true)
      const activeFile = files.find(f => f.isActive)
      const anyFile = activeFile || files[0]
      
      if (anyFile && (!state().filePath || state().filePath !== anyFile.path)) {
        // Small delay to ensure UI is ready
        setTimeout(() => {
          openPreview(anyFile.path)
        }, 100)
      }
    }
  })
  
  // Also listen to SDK session changes
  createEffect(() => {
    const session = sdk.session
    if (!session) return
    
    // Trigger file detection when session changes
    const files = detectWebAppFiles()
    if (files.length > 0 && config().autoPreview && !state().isOpen) {
      setTimeout(() => {
        openPreview()
      }, 200)
    }
  })
  
  // Auto-open preview on initial load if files exist
  createEffect(() => {
    const files = detectWebAppFiles()
    if (files.length > 0 && config().autoPreview && !state().isOpen && !state().filePath) {
      // Wait a bit for the UI to fully initialize
      setTimeout(() => {
        if (!state().isOpen) {
          openPreview()
        }
      }, 500)
    }
  })

  // Cleanup
  onCleanup(() => {
    // Cleanup logic if needed
  })

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
