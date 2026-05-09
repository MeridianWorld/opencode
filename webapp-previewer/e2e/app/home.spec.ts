import { test, expect } from "../fixtures"

test("root opens the hosted demo workspace", async ({ page }) => {
  await page.goto("/")

  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('[data-component="atoms-v2-page"]')).toBeVisible()
  await expect(page.getByText("Demo workspace").first()).toBeVisible()
  await expect(page.frameLocator('iframe[title="Preview index.html"]').getByText("EmailFlow").first()).toBeVisible()
})
