import { describe, expect, it } from "bun:test"
import type { FileContent, FileNode } from "@opencode-ai/sdk/v2"
import { createWorkspaceData, fileText } from "./workspace"

const node = (input: Pick<FileNode, "name" | "path" | "type">): FileNode => ({
  ...input,
  absolute: input.path,
  ignored: false,
})

const text = (content: string, mimeType = "text/plain"): FileContent => ({
  type: "text",
  content,
  mimeType,
})

describe("atoms-v2 workspace adapter", () => {
  it("maps backend file nodes into atoms tree entries and chooses html preview", () => {
    const data = createWorkspaceData({
      nodes: [
        node({ name: "src", path: "src", type: "directory" }),
        node({ name: "main.ts", path: "src/main.ts", type: "file" }),
        node({ name: "index.html", path: "index.html", type: "file" }),
      ],
      content: (path) => (path === "index.html" ? text("<h1>Backend Preview</h1>", "text/html") : undefined),
    })

    expect(data.tree).toEqual([
      { id: "src", label: "src", kind: "folder", depth: 0 },
      { id: "src/main.ts", label: "main.ts", kind: "file", depth: 1 },
      { id: "index.html", label: "index.html", kind: "file", depth: 0 },
    ])
    expect(data.initial).toBe("index.html")
    expect(data.preview).toEqual({
      path: "index.html",
      label: "index.html",
      html: "<h1>Backend Preview</h1>",
    })
  })

  it("renders binary file content as a readable editor placeholder", () => {
    expect(fileText({ type: "binary", content: "", mimeType: "image/png" })).toBe(
      "Binary file cannot be displayed in the editor.",
    )
  })
})
