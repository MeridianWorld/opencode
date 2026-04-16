import { describe, expect, test } from "bun:test"
import { href, locate } from "./use-webapp-preview"

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
})
