import { expect } from "@playwright/test"
import { test } from "../fixtures"

test("switches modes inside one atoms workbench surface", async ({ page, gotoSession }) => {
  await page.setViewportSize({ width: 2048, height: 1003 })
  await gotoSession()

  const bench = page.locator('[data-component="atoms-workbench"]')
  const top = page.locator('[data-component="atoms-topbar"]')
  const body = page.locator('[data-component="atoms-workbench-body"]')

  await expect(bench).toHaveCount(1)
  await expect(bench).toBeVisible()
  await expect(page.locator('[data-component="atoms-side"]')).toHaveCount(0)
  await expect(body).toBeVisible()
  await bench.evaluate((node) => node.setAttribute("data-e2e-stick", "workbench"))
  await expect(bench).toHaveAttribute("data-e2e-stick", "workbench")
  await expect(bench.locator('[data-component="atoms-preview"]')).toBeVisible()

  await top.getByRole("button", { name: /^Files$/ }).click()
  await expect(bench).toHaveCount(1)
  await expect(bench).toHaveAttribute("data-e2e-stick", "workbench")
  await expect(bench.locator('[data-component="atoms-files-pane"]')).toBeVisible()

  await top.getByRole("button", { name: /^Editor$/ }).click()
  await expect(bench).toHaveCount(1)
  await expect(bench).toHaveAttribute("data-e2e-stick", "workbench")
  await expect(bench.locator('[data-component="atoms-editor-pane"]')).toBeVisible()

  await top.getByRole("button", { name: /^Files$/ }).click()
  await expect(bench).toHaveAttribute("data-e2e-stick", "workbench")
  await page.getByRole("button", { name: /^All$/ }).click()
  await page.locator('[data-component="filetree"]').getByRole("button", { name: /README\.md/i }).first().click()
  await expect(bench).toHaveCount(1)
  await expect(bench).toHaveAttribute("data-e2e-stick", "workbench")
  await expect(bench.locator('[data-component="atoms-editor-pane"]')).toBeVisible()

  await top.getByRole("button", { name: /^Inspect$/ }).click()
  await expect(bench).toHaveCount(1)
  await expect(bench).toHaveAttribute("data-e2e-stick", "workbench")
  await expect(bench.locator('[data-component="atoms-inspect-pane"]')).toBeVisible()

  await top.getByRole("button", { name: /^Preview$/ }).click()
  await expect(bench).toHaveCount(1)
  await expect(bench).toHaveAttribute("data-e2e-stick", "workbench")
  await expect(bench.locator('[data-component="atoms-preview"]')).toBeVisible()
})
