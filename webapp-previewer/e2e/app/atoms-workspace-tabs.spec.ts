import { expect } from "@playwright/test"
import { test } from "../fixtures"

test("switches workspace tabs on the draft session screen without breaking the shell", async ({ page, gotoSession }) => {
  await page.setViewportSize({ width: 2048, height: 1003 })
  await gotoSession()

  const topbar = page.locator('[data-component="atoms-topbar"]')
  const side = page.locator('[data-component="atoms-side"]')
  const rail = page.locator('[data-component="atoms-rail"]')
  const title = (value: string) => side.getByText(new RegExp(`^${value}$`)).first()
  const errs: string[] = []
  const onerr = (err: Error) => errs.push(err.message)

  page.on("pageerror", onerr)

  await expect(topbar).toBeVisible()
  await expect(title("App Viewer")).toBeVisible()

  await topbar.getByRole("button", { name: /^Files$/ }).click()
  await expect(title("Files")).toBeVisible()
  await expect(side.getByText(/Workspace tree|Changed files/i)).toBeVisible()
  await side.getByRole("button", { name: /^All$/ }).click()
  await side.locator('[data-component="filetree"]').getByRole("button", { name: /README\.md/i }).first().click()

  await expect(title("Editor")).toBeVisible()
  await expect(side.getByRole("button", { name: /README\.md/i }).first()).toBeVisible()

  await rail.getByRole("button", { name: /Editor/i }).click()
  await expect(title("Editor")).toBeVisible()

  await topbar.getByRole("button", { name: /^Inspect$/ }).click()
  await expect(title("Inspect")).toBeVisible()

  await topbar.getByRole("button", { name: /^Files$/ }).click()
  await expect(title("Files")).toBeVisible()

  await rail.getByRole("button", { name: /Preview/i }).click()
  await expect(title("App Viewer")).toBeVisible()
  await expect(page.locator('[data-component="atoms-preview"]')).toBeVisible()

  page.off("pageerror", onerr)
  expect(errs).toEqual([])
})
