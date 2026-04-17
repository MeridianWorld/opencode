import { expect } from "@playwright/test"
import { test } from "../fixtures"

test("renders an atoms builder-style session panel", async ({ page, project }) => {
  await page.setViewportSize({ width: 1600, height: 1003 })
  await project.open()
  const id = await project.user("left panel smoke")
  await project.gotoSession(id)

  const panel = page.locator('[data-component="atoms-chat"]')
  const switcher = page.locator('[data-component="atoms-session-switcher"]')
  const composer = page.locator('[data-component="atoms-composer"]')

  await expect(panel).toBeVisible()
  await expect(panel.getByText(/^Conversation$/)).toHaveCount(0)
  await expect(switcher).toBeVisible()
  await expect(switcher.getByRole("button", { name: /new session/i })).toBeVisible()
  await expect(composer).toBeVisible()

  await switcher.getByRole("button", { name: /new session/i }).click()
  await expect(switcher).toContainText("Draft session")
})
