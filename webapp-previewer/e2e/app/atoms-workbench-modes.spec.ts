import { expect } from "@playwright/test"
import { base64Encode } from "@opencode-ai/util/encode"
import fs from "node:fs/promises"
import path from "node:path"
import { test } from "../fixtures"

test("atoms-v2 keeps one shell while switching viewer and editor modes", async ({ page, project }) => {
  await page.setViewportSize({ width: 1728, height: 1117 })
  await project.open({
    setup: async (dir) => {
      await fs.writeFile(path.join(dir, "index.html"), "<h1>Mode Preview</h1>")
      await fs.writeFile(path.join(dir, "styles.css"), "body { color: #123; }")
    },
  })

  const shell = page.locator('[data-component="atoms-v2-shell"]')
  const nav = page.locator(".atoms-v2-stage__nav")
  const editor = page.locator('[data-component="atoms-v2-editor"]')
  await expect(shell).toBeVisible()
  await expect(page.locator('[data-component="atoms-v2-viewer"]')).toBeVisible()

  await nav.getByRole("button", { name: "Editor", exact: true }).click()
  await expect(editor).toBeVisible()

  await editor.locator(".atoms-v2-editor__tree").getByRole("button", { name: /styles\.css/ }).click()
  await page.getByRole("button", { name: "Close styles.css" }).click()
  await expect(editor.locator(".atoms-v2-editor__tabs").getByRole("button", { name: "styles.css", exact: true })).toHaveCount(0)

  await nav.getByRole("button", { name: "App Viewer", exact: true }).click()
  await expect(page.locator('[data-component="atoms-v2-viewer"]')).toBeVisible()
  await expect(shell).toBeVisible()
})

test("atoms-v2 gives the composer text layer proper inset", async ({ page, project }) => {
  await page.setViewportSize({ width: 1728, height: 1117 })
  await project.open()

  const input = page.locator('.atoms-v2-composer [data-component="prompt-input"]')
  const hint = page.locator('.atoms-v2-composer [data-component="prompt-input"] + div:not([aria-hidden])')

  await expect(input).toBeVisible()
  await expect(hint).toBeVisible()

  expect(await input.evaluate((node) => getComputedStyle(node).paddingLeft)).toBe("20px")
  expect(await input.evaluate((node) => getComputedStyle(node).paddingTop)).toBe("16px")
  expect(await hint.evaluate((node) => getComputedStyle(node).paddingLeft)).toBe("20px")
  expect(await hint.evaluate((node) => getComputedStyle(node).paddingTop)).toBe("16px")
})

test("atoms-v2 shows live session prompts and assistant replies in the conversation", async ({ page, project }) => {
  await page.setViewportSize({ width: 1728, height: 1117 })
  await project.open()

  const input = page.locator('.atoms-v2-composer [data-component="prompt-input"]')
  await input.click()
  await page.keyboard.type("wire the atoms chat")
  await expect(input).toContainText("wire the atoms chat")
  await page.keyboard.press("ControlOrMeta+A")
  await page.keyboard.press("Backspace")

  await project.prompt("wire the atoms chat")

  const chat = page.locator('[data-component="atoms-v2-conversation"]')
  await expect(chat).toContainText("wire the atoms chat")
  await expect(chat).toContainText("ok")
})

test("atoms-v2 loads workspace files through the official backend", async ({ page, project }) => {
  await page.setViewportSize({ width: 1728, height: 1117 })
  await project.open({
    setup: async (dir) => {
      await fs.writeFile(
        path.join(dir, "index.html"),
        '<link rel="stylesheet" href="styles.css"><h1>Backend Preview</h1><script src="app.js"></script>',
      )
      await fs.writeFile(path.join(dir, "styles.css"), "body { background: rgb(1, 2, 3); } h1 { color: rgb(4, 5, 6); }")
      await fs.writeFile(path.join(dir, "app.js"), "document.body.dataset.script = 'loaded'; console.log('backend-app')")
    },
  })

  const frame = page.frameLocator(".atoms-v2-preview-frame")
  await expect(frame.getByRole("heading", { name: "Backend Preview" })).toBeVisible()
  await expect(frame.locator("body")).toHaveCSS("background-color", "rgb(1, 2, 3)")
  await expect(frame.locator("body")).toHaveAttribute("data-script", "loaded")

  const nav = page.locator(".atoms-v2-stage__nav")
  await nav.getByRole("button", { name: "Editor", exact: true }).click()

  const editor = page.locator('[data-component="atoms-v2-editor"]')
  await expect(editor.locator(".atoms-v2-editor__tree").getByRole("button", { name: /index\.html/ })).toBeVisible()
  await editor.locator(".atoms-v2-editor__tree").getByRole("button", { name: /app\.js/ }).click()
  await expect(editor.locator(".atoms-v2-editor__code")).toContainText("backend-app")
})

test("atoms-v2 loads relative preview assets from the selected workspace directory", async ({ page }) => {
  await page.setViewportSize({ width: 1728, height: 1117 })

  await page.goto(`/${base64Encode(path.resolve("..", "test-html"))}/session`)
  await expect(page.locator('[data-component="atoms-v2-page"]')).toBeVisible()

  const frame = page.frameLocator(".atoms-v2-preview-frame")
  await expect(frame.locator("body")).toHaveCSS("background-color", "rgb(248, 250, 252)")
  await expect.poll(() => frame.locator("body").evaluate(() => window.innerWidth)).toBeGreaterThanOrEqual(1200)
  await expect(frame.locator(".sidebar")).toBeVisible()
  await expect(frame.locator(".template-card")).toHaveCount(14)
})
