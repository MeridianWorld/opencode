import fs from "node:fs/promises"
import path from "node:path"
import { expect } from "@playwright/test"
import { test } from "../fixtures"

test("uses a dedicated editor pane with closable file tabs", async ({ page, project }) => {
  await page.setViewportSize({ width: 2048, height: 1003 })
  await project.open({
    setup: async (dir) => {
      await fs.writeFile(path.join(dir, "alpha.ts"), 'export const alpha = "alpha file"\n')
      await fs.writeFile(path.join(dir, "beta.ts"), 'export const beta = "beta file"\n')
    },
  })

  const top = page.locator('[data-component="atoms-topbar"]')
  const side = page.locator('[data-component="atoms-side"]')
  const editor = page.locator('[data-component="atoms-editor-pane"]')
  const files = page.locator('[data-component="atoms-files-pane"]')
  const tabs = page.locator('[data-component="atoms-editor-tabs"]')

  await top.getByRole("button", { name: /^Editor$/ }).click()
  await expect(side).toContainText("Editor")
  await expect(editor).toBeVisible()
  await expect(editor).toContainText(/No open files/i)
  await expect(files).toHaveCount(0)

  await top.getByRole("button", { name: /^Files$/ }).click()
  await expect(files).toBeVisible()
  await side.getByRole("button", { name: /^All$/ }).click()
  await side.locator('[data-component="filetree"]').getByRole("button", { name: /^alpha\.ts$/ }).click()

  await expect(side).toContainText("Editor")
  await expect(editor).toBeVisible()
  await expect(files).toHaveCount(0)
  await expect(tabs).toContainText("alpha.ts")
  await expect(editor).toContainText("alpha file")

  await top.getByRole("button", { name: /^Files$/ }).click()
  await side.locator('[data-component="filetree"]').getByRole("button", { name: /^beta\.ts$/ }).click()

  await expect(editor).toBeVisible()
  await expect(tabs).toContainText("alpha.ts")
  await expect(tabs).toContainText("beta.ts")
  await expect(editor).toContainText("beta file")

  await tabs.getByRole("button", { name: /close beta\.ts/i }).click()
  await expect(tabs).toContainText("alpha.ts")
  await expect(tabs).not.toContainText("beta.ts")
  await expect(editor).toContainText("alpha file")

  await tabs.getByRole("button", { name: /close alpha\.ts/i }).click()
  await expect(editor).toContainText(/No open files/i)
  await expect(page.locator('[data-component="filetab-content"]')).toHaveCount(0)
})
