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
