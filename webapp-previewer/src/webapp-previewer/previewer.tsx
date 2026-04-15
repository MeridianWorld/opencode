/**
 * WebApp Previewer Component
 * 
 * Main component for displaying web application previews
 */

import { Show, For, createMemo, createEffect, onCleanup } from "solid-js"
import { Portal } from "solid-js/web"
import { useWebAppPreview } from "./use-webapp-preview"
import type { DeviceMode } from "./types"

export function WebAppPreviewer() {
  const preview = useWebAppPreview()
  const state = preview.state

  // Add/remove body class when preview is open to compress main layout
  createEffect(() => {
    if (state().isOpen) {
      document.body.style.marginRight = "32rem"
      document.body.style.transition = "margin-right 0.3s ease"
    } else {
      document.body.style.marginRight = "0"
    }
    
    // Cleanup on unmount
    onCleanup(() => {
      document.body.style.marginRight = ""
    })
  })

  // Debug: Log state changes
  console.log('[WebAppPreviewer] Current state:', {
    isOpen: state().isOpen,
    previewUrl: state().previewUrl,
    detectedFiles: preview.detectedFiles().length
  })

  const deviceDimensions = createMemo(() => {
    const mode = state().deviceMode
    switch (mode) {
      case "mobile":
        return { width: "375px", label: "Mobile" }
      case "tablet":
        return { width: "768px", label: "Tablet" }
      case "desktop":
      default:
        return { width: "100%", label: "Desktop" }
    }
  })

  return (
    <Portal>
      <>
        <Show when={!state().isOpen}>
          <div style="position: fixed; bottom: 5rem; right: 1rem; z-index: 99999;">
            <button
              onClick={() => {
                console.log('[Preview Button] Clicked, toggling preview...')
                preview.togglePreview()
              }}
              style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background-color: #3b82f6; color: white; border-radius: 0.5rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); transition: all 0.2s;"
              title="Open Web App Preview"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              <span style="font-size: 0.875rem; font-weight: 500;">Preview</span>
            </button>
          </div>
        </Show>

        <Show when={state().isOpen}>
          <div style="position: fixed; top: 0; right: 0; bottom: 0; width: 32rem; height: 100vh; z-index: 50; background-color: #0d0d0d; box-shadow: -2px 0 8px rgba(0, 0, 0, 0.2);">
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 1rem; background-color: #141414; border-bottom: 1px solid #262626;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                  <span style="font-size: 0.75rem; font-weight: 500; color: #8c8c8c; text-transform: uppercase; letter-spacing: 0.05em;">
                    Web App Preview
                  </span>
                  
                  <div style="display: flex; align-items: center; background-color: #1f1f1f; border-radius: 0.5rem; padding: 0.25rem;">
                    <button
                      onClick={() => preview.setDeviceMode("desktop")}
                      style={`padding: 0.25rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; transition: color 0.2s; ${
                        state().deviceMode === "desktop"
                          ? "background-color: #333333; color: white;"
                          : "color: #8c8c8c;"
                      }`}
                    >
                      Desktop
                    </button>
                    <button
                      onClick={() => preview.setDeviceMode("tablet")}
                      style={`padding: 0.25rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; transition: color 0.2s; ${
                        state().deviceMode === "tablet"
                          ? "background-color: #333333; color: white;"
                          : "color: #8c8c8c;"
                      }`}
                    >
                      Tablet
                    </button>
                    <button
                      onClick={() => preview.setDeviceMode("mobile")}
                      style={`padding: 0.25rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; transition: color 0.2s; ${
                        state().deviceMode === "mobile"
                          ? "background-color: #333333; color: white;"
                          : "color: #8c8c8c;"
                      }`}
                    >
                      Mobile
                    </button>
                  </div>
                </div>

                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <button
                    onClick={() => preview.setAutoPreview(!state().autoPreview)}
                    style={`padding: 0.375rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem; ${
                      state().autoPreview
                        ? "background-color: #333333; color: white;"
                        : "color: #8c8c8c;"
                    }`}
                    title="Toggle auto-preview"
                  >
                    <span>Auto</span>
                    <Show when={state().autoPreview}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </Show>
                  </button>

                  <a
                    href={state().previewUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    style="padding: 0.5rem; border-radius: 0.375rem; transition: all 0.2s; color: #8c8c8c;"
                    title="Open in new tab"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                  </a>

                  <button
                    onClick={() => preview.closePreview()}
                    style="color: #8c8c8c;"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>

              <div style="display: flex; flex-direction: column; height: 100%; overflow: hidden; background: radial-gradient(#262626 1px, transparent 1px); background-size: 20px 20px;">
                <Show
                  when={state().previewUrl && preview.detectedFiles().length > 0}
                  fallback={
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; flex: 1;">
                      <div style="width: 4rem; height: 4rem; background-color: #1a1a1a; border-radius: 1rem; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; border: 1px solid #262626;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8c8c8c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                          <line x1="8" y1="21" x2="16" y2="21"></line>
                          <line x1="12" y1="17" x2="12" y2="21"></line>
                        </svg>
                      </div>
                      <h2 style="font-size: 1.25rem; font-weight: 700; color: white; margin-bottom: 0.5rem;">Select HTML File to Preview</h2>
                      <p style="color: #8c8c8c; max-width: 28rem; margin-bottom: 1.5rem;">
                        Choose an HTML file from the detected files below
                      </p>
                      <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 100%; max-width: 28rem;">
                        <For each={preview.detectedFiles()}>
                          {(file) => (
                            <button
                              onClick={() => {
                                console.log('[File Select] Clicked:', file.path)
                                preview.openPreview(file.path)
                              }}
                              style={`padding: 0.75rem 1rem; border-radius: 0.5rem; text-align: left; transition: all 0.2s; border: 1px solid ${
                                state().filePath === file.path ? '#3b82f6' : '#262626'
                              }; background-color: ${
                                state().filePath === file.path ? '#1e3a8a' : '#1a1a1a'
                              }; color: white; cursor: pointer;`}
                            >
                              <div style="font-weight: 500; margin-bottom: 0.25rem;">{file.name}</div>
                              <div style="font-size: 0.75rem; color: #8c8c8c;">{file.relativePath}</div>
                            </button>
                          )}
                        </For>
                      </div>
                    </div>
                  }
                >
                  <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 0;">
                    <div
                      style={{
                        width: deviceDimensions().width,
                        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        height: "100%",
                        backgroundColor: "white",
                        overflow: "hidden",
                      }}
                    >
                      <iframe
                        src={state().previewUrl!}
                        style="width: 100%; height: 100%; border: none; display: block;"
                        title="Web App Preview"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                      />
                    </div>
                  </div>
                </Show>
              </div>
            </div>
        </Show>
      </>
    </Portal>
  )
}
