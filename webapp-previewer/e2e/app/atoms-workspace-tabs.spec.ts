import { expect } from "@playwright/test"
import { test } from "../fixtures"

test("switches workspace tabs on the draft session screen without breaking the shell", async ({ page, gotoSession }) => {
  await page.setViewportSize({ width: 2048, height: 1003 })
  await gotoSession()

  const topbar = page.locator('[data-component="atoms-topbar"]')
  const side = page.locator('[data-component="atoms-side"]')
  const rail = page.locator('[data-component="atoms-rail"]')
  const title = (value: string) => side.getByText(new RegExp(`^${value}$`)).first()

  await expect(topbar).toBeVisible()
  await expect(title("App Viewer")).toBeVisible()

  await rail.getByRole("button", { name: /Editor/i }).click()
  await expect(title("Editor")).toBeVisible()
  await expect(side.getByText(/Select a file to inspect it in the editor/i)).toBeVisible()

  await topbar.getByRole("button", { name: /^Files$/ }).click()
  await expect(title("Files")).toBeVisible()
  await expect(side.getByText(/Workspace tree|Changed files/i)).toBeVisible()

  await topbar.getByRole("button", { name: /^Inspect$/ }).click()
  await expect(title("Inspect")).toBeVisible()

  await rail.getByRole("button", { name: /Preview/i }).click()
  await expect(title("App Viewer")).toBeVisible()
  await expect(page.locator('[data-component="atoms-preview"]')).toBeVisible()
})
