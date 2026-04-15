import { For, Show, createMemo } from "solid-js"
import { getFilename } from "@opencode-ai/util/path"
import { useWebAppPreview } from "@/webapp-previewer/use-webapp-preview"

const modes = [
  { id: "desktop", label: "Desktop", width: "100%" },
  { id: "tablet", label: "Tablet", width: "820px" },
  { id: "mobile", label: "Mobile", width: "390px" },
] as const

export function AtomsPreview() {
  const preview = useWebAppPreview({ autoPreview: true })
  const state = preview.state

  const frame = createMemo(() => {
    return modes.find((item) => item.id === state().deviceMode) ?? modes[0]
  })

  return (
    <div
      data-component="atoms-preview"
      style={{
        width: "100%",
        height: "100%",
        "min-width": "0",
        "min-height": "0",
        display: "grid",
        "grid-template-columns": "17rem minmax(0,1fr)",
      }}
    >
      <aside
        style={{
          "min-width": "0",
          "min-height": "0",
          background: "var(--atoms-panel)",
          "border-right": "1px solid var(--atoms-line)",
        }}
      >
        <div class="border-b border-[var(--atoms-line)] px-4 py-3">
          <div class="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--atoms-soft)]">HTML targets</div>
          <div class="mt-2 text-[14px] leading-6 text-[var(--atoms-soft)]">
            Pick a generated entry file and render it through the official backend viewer.
          </div>
        </div>
        <div class="min-h-0 overflow-auto px-3 py-3">
          <Show
            when={preview.detectedFiles().length > 0}
            fallback={
              <div class="rounded-[24px] border border-dashed border-[var(--atoms-line)] bg-white px-4 py-5 text-[13px] leading-6 text-[var(--atoms-soft)]">
                No HTML output detected yet. Ask the agent to scaffold a page and this panel will attach itself.
              </div>
            }
          >
            <div class="flex flex-col gap-2">
              <For each={preview.detectedFiles()}>
                {(file) => (
                  <button
                    type="button"
                    onClick={() => {
                      void preview.openPreview(file.path)
                    }}
                    class="rounded-[22px] border px-4 py-3 text-left transition"
                    classList={{
                      "border-[var(--atoms-line)] bg-white hover:border-[var(--atoms-accent)]": state().filePath !== file.path,
                      "border-[var(--atoms-accent)] bg-[var(--atoms-chip)] shadow-[0_12px_30px_rgba(63,110,245,0.14)]":
                        state().filePath === file.path,
                    }}
                  >
                    <div class="text-[15px] font-medium text-[var(--atoms-ink)]">{file.name}</div>
                    <div class="mt-1 text-[12px] leading-5 text-[var(--atoms-soft)]">{file.relativePath}</div>
                  </button>
                )}
              </For>
            </div>
          </Show>
        </div>
      </aside>

      <div style={{ "min-width": "0", "min-height": "0", display: "flex", "flex-direction": "column" }}>
        <div style={{ padding: "0.75rem 1rem", "border-bottom": "1px solid var(--atoms-line)", "flex-shrink": 0 }}>
          <div class="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div class="min-w-0">
              <div class="truncate rounded-full border border-[var(--atoms-line)] bg-white px-3 py-1 text-[12px] font-medium text-[var(--atoms-soft)]">
                {state().filePath ? getFilename(state().filePath ?? undefined) : "Awaiting preview"}
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <For each={modes}>
                {(item) => (
                  <button
                    type="button"
                    onClick={() => preview.setDeviceMode(item.id)}
                    class="rounded-full border px-3 py-1.5 text-[13px] font-medium transition"
                    classList={{
                      "border-[var(--atoms-line)] bg-white text-[var(--atoms-soft)] hover:text-[var(--atoms-ink)]":
                        state().deviceMode !== item.id,
                      "border-[var(--atoms-accent)] bg-[var(--atoms-chip)] text-[var(--atoms-ink)]": state().deviceMode === item.id,
                    }}
                  >
                    {item.label}
                  </button>
                )}
              </For>
              <button
                type="button"
                onClick={() => preview.setAutoPreview(!state().autoPreview)}
                class="rounded-full border border-[var(--atoms-line)] bg-white px-3 py-1.5 text-[13px] font-medium text-[var(--atoms-soft)] transition hover:text-[var(--atoms-ink)]"
              >
                Auto {state().autoPreview ? "On" : "Off"}
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            "min-width": "0",
            "min-height": "0",
            flex: 1,
            overflow: "auto",
            padding: "1.25rem",
            background:
              "radial-gradient(circle at top, rgba(63,110,245,0.08), transparent 42%), linear-gradient(180deg,#f5f2eb 0%,#f8f6f1 100%)",
          }}
        >
          <Show
            when={state().previewUrl}
            fallback={
              <div class="grid h-full min-h-[22rem] place-items-center rounded-[32px] border border-dashed border-[var(--atoms-line)] bg-white/70 px-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                <div class="max-w-md">
                  <div class="text-[26px] font-semibold text-[var(--atoms-ink)]">Preview will appear here</div>
                  <div class="mt-3 text-[14px] leading-7 text-[var(--atoms-soft)]">
                    Generate or update an HTML file in the session and this canvas will keep following it.
                  </div>
                </div>
              </div>
            }
          >
            <div class="flex min-h-full items-start justify-center">
              <div
                class="h-[min(100%,56rem)] min-h-[28rem] overflow-hidden rounded-[30px] border border-[var(--atoms-line)] bg-white shadow-[0_30px_80px_rgba(15,31,58,0.12)]"
                style={{ width: frame().width }}
              >
                <iframe
                  src={state().previewUrl!}
                  class="size-full border-0"
                  title="Atoms preview"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                />
              </div>
            </div>
          </Show>
        </div>
      </div>
    </div>
  )
}
