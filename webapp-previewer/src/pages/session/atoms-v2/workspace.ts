import type { FileContent, FileNode } from "@opencode-ai/sdk/v2"
import type { Tree } from "./fixtures"

export type Preview = {
  path: string
  label: string
  html: string
}

export type WorkspaceData = {
  tree: Tree[]
  docs: Record<string, string>
  initial?: string
  preview?: Preview
}

export function fileText(file?: FileContent) {
  if (!file) return ""
  if (file.type === "binary") return "Binary file cannot be displayed in the editor."
  return file.content
}

function name(path: string) {
  return path.replaceAll("\\", "/").split("/").at(-1) ?? path
}

function depth(path: string) {
  const text = path.replaceAll("\\", "/")
  if (!text) return 0
  return Math.max(0, text.split("/").length - 1)
}

function html(node: FileNode, file?: FileContent) {
  if (node.type !== "file") return false
  if (node.path.toLowerCase().endsWith(".html")) return true
  return file?.mimeType === "text/html"
}

function external(url: string) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url)
}

function join(base: string, asset: string) {
  const text = asset.startsWith("/") ? asset.slice(1) : `${base}/${asset}`
  return text
    .replaceAll("\\", "/")
    .split("/")
    .reduce((all, part) => {
      if (!part || part === ".") return all
      if (part === "..") return all.slice(0, -1)
      return [...all, part]
    }, [] as string[])
    .join("/")
}

function folder(path: string) {
  const parts = path.replaceAll("\\", "/").split("/")
  parts.pop()
  return parts.join("/")
}

export function viewUrl(input: { server: string; directory: string; path: string }) {
  const server = input.server.replace(/\/$/, "")
  const file = input.path
    .replaceAll("\\", "/")
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")
  return `${server}/view/${file}?directory=${encodeURIComponent(input.directory)}`
}

export function rewriteHtml(input: { html: string; server: string; directory: string; path: string }) {
  const dir = folder(input.path)
  return input.html.replace(/\b(href|src)=(["'])([^"']+)\2/gi, (match, attr: string, quote: string, value: string) => {
    if (external(value)) return match
    return `${attr}=${quote}${viewUrl({
      server: input.server,
      directory: input.directory,
      path: join(dir, value),
    })}${quote}`
  })
}

export function createWorkspaceData(input: {
  nodes: readonly FileNode[]
  content: (path: string) => FileContent | undefined
  html?: (path: string, content: string) => string
}): WorkspaceData {
  const files = input.nodes.filter((item) => item.type === "file")
  const initial = files.find((item) => html(item, input.content(item.path)))?.path ?? files[0]?.path
  const docs = Object.fromEntries(
    files.flatMap((item) => {
      const file = input.content(item.path)
      if (!file) return []
      return [[item.path, fileText(file)] as const]
    }),
  )
  const pick = files.find((item) => html(item, input.content(item.path)))
  const file = pick ? input.content(pick.path) : undefined
  const preview =
    pick && file?.type === "text"
      ? {
          path: pick.path,
          label: name(pick.path),
          html: input.html?.(pick.path, file.content) ?? file.content,
        }
      : undefined

  return {
    tree: input.nodes.map((item) => ({
      id: item.path,
      label: item.name || name(item.path),
      kind: item.type === "directory" ? "folder" : "file",
      depth: depth(item.path),
    })),
    docs,
    initial,
    preview,
  }
}
