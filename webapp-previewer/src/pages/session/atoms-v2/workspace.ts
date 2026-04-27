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

export function createWorkspaceData(input: {
  nodes: readonly FileNode[]
  content: (path: string) => FileContent | undefined
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
          html: file.content,
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
