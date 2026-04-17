import { expect, test } from "../fixtures"

test("session route keeps history affordances while suppressing default chrome", async ({ page, project }) => {
  await page.setViewportSize({ width: 2048, height: 1003 })
  await project.open()

  await expect(page.locator('[data-component="atoms-page"]')).toBeVisible()
  await expect(page.getByRole("button", { name: /navigate back/i })).toBeVisible()
  await expect(page.getByRole("button", { name: /navigate forward/i })).toBeVisible()
  await expect(page.getByRole("button", { name: /toggle sidebar/i })).toHaveCount(0)
  await expect(page.locator('[data-component="sidebar-nav-desktop"]')).toHaveCount(0)
})

test("non-session routes keep the default shell", async ({ page }) => {
  await page.setViewportSize({ width: 2048, height: 1003 })
  await page.goto("/")

  await expect(page.locator('header[role="banner"], header').first()).toBeVisible()
  await expect(page.getByRole("button", { name: /toggle sidebar/i })).toBeVisible()
})
