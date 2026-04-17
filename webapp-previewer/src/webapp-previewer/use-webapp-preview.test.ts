import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test"
import { createRoot } from "solid-js"

let href: typeof import("./use-webapp-preview").href
let locate: typeof import("./use-webapp-preview").locate
let useWebAppPreview: typeof import("./use-webapp-preview").useWebAppPreview

const sdk = {
  url: "http://127.0.0.1:4321",
}

const sync = {
  directory: "D:\\github_repo\\opencode\\test-html",
  data: {
    session_diff: {},
  },
}

beforeAll(async () => {
  mock.module("@/context/sdk", () => ({
    useSDK: () => sdk,
  }))

  mock.module("@/context/sync", () => ({
    useSync: () => sync,
  }))

  const mod = await import("./use-webapp-preview")
  href = mod.href
  locate = mod.locate
  useWebAppPreview = mod.useWebAppPreview
})

beforeEach(() => {
  sdk.url = "http://127.0.0.1:4321"
  sync.directory = "D:\\github_repo\\opencode\\test-html"
  sync.data.session_diff = {}
})

describe("web app preview paths", () => {
  test("keeps workspace html entries relative on Windows roots", () => {
    const file = locate("D:\\github_repo\\opencode\\test-html", "index.html")
    expect(file.path).toBe("D:/github_repo/opencode/test-html/index.html")
    expect(file.relative).toBe("index.html")
  })

  test("normalizes absolute Windows html paths under the same workspace", () => {
    const file = locate("D:\\github_repo\\opencode\\test-html", "D:/github_repo/opencode/test-html/index.html")
    expect(file.path).toBe("D:/github_repo/opencode/test-html/index.html")
    expect(file.relative).toBe("index.html")
  })

  test("builds a backend preview url from the normalized relative path", () => {
    const url = href(
      "http://localhost:4096",
      "D:\\github_repo\\opencode\\test-html",
      "D:/github_repo/opencode/test-html/index.html",
    )
    expect(url).toBe(
      "http://localhost:4096/view/index.html?directory=D%3A%5Cgithub_repo%5Copencode%5Ctest-html",
    )
  })

  test("defaults the preview backend to the active SDK url", () => {
    createRoot((dispose) => {
      const preview = useWebAppPreview({ autoPreview: false })

      expect(preview.generatePreviewUrl("index.html")).toBe(
        "http://127.0.0.1:4321/view/index.html?directory=D%3A%5Cgithub_repo%5Copencode%5Ctest-html",
      )

      dispose()
    })
  })

  test("keeps an explicit backend override when one is provided", () => {
    createRoot((dispose) => {
      const preview = useWebAppPreview({
        autoPreview: false,
        backendUrl: "http://localhost:4096",
      })

      expect(preview.generatePreviewUrl("index.html")).toBe(
        "http://localhost:4096/view/index.html?directory=D%3A%5Cgithub_repo%5Copencode%5Ctest-html",
      )

      dispose()
    })
  })
})
