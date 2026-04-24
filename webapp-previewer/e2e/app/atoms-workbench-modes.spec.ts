import { expect } from "@playwright/test"
import { test } from "../fixtures"

test("atoms-v2 keeps one shell while switching viewer and editor modes", async ({ page, project }) => {
  await page.setViewportSize({ width: 1728, height: 1117 })
  await project.open()

  const shell = page.locator('[data-component="atoms-v2-shell"]')
  const nav = page.locator(".atoms-v2-stage__nav")
  const editor = page.locator('[data-component="atoms-v2-editor"]')
  await expect(shell).toBeVisible()
  await expect(page.locator('[data-component="atoms-v2-viewer"]')).toBeVisible()

  await nav.getByRole("button", { name: "Editor", exact: true }).click()
  await expect(editor).toBeVisible()

  await editor.locator(".atoms-v2-editor__tabs").getByRole("button", { name: "styles.css", exact: true }).click()
  await page.getByRole("button", { name: "Close styles.css" }).click()
  await expect(editor.locator(".atoms-v2-editor__tabs").getByRole("button", { name: "styles.css", exact: true })).toHaveCount(0)

  await nav.getByRole("button", { name: "App Viewer", exact: true }).click()
  await expect(page.locator('[data-component="atoms-v2-viewer"]')).toBeVisible()
  await expect(shell).toBeVisible()
})
