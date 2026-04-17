import { expect, test } from "../fixtures"

test("session route suppresses the default opencode chrome", async ({ page, project }) => {
  await page.setViewportSize({ width: 2048, height: 1003 })
  await project.open()

  await expect(page.locator('[data-component="atoms-page"]')).toBeVisible()
  await expect(page.getByRole("button", { name: /toggle sidebar/i })).toHaveCount(0)
  await expect(page.locator('[data-component="sidebar-nav-desktop"]')).toHaveCount(0)
})
