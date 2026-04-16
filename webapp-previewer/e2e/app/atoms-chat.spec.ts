import { expect } from "@playwright/test"
import { test } from "../fixtures"
import { withSession } from "../actions"

test("renders the atoms chat surface with header stream and composer", async ({ page, sdk, gotoSession }) => {
  await withSession(sdk, `atoms chat ${Date.now()}`, async (session) => {
    await gotoSession(session.id)
    await expect(page.locator('[data-component="atoms-chat-header"]')).toBeVisible()
    await expect(page.locator('[data-component="atoms-chat-stream"]')).toBeVisible()
    await expect(page.locator('[data-component="atoms-composer"]')).toBeVisible()
  })
})

test("shows the draft new-session branch when there is no active session", async ({ page, gotoSession }) => {
  await gotoSession()
  await expect(page.locator('[data-component="atoms-chat"]')).toBeVisible()
  await expect(page.locator('[data-component="atoms-chat-header"]')).toHaveCount(0)
  await expect(page.locator('[data-component="atoms-chat-stream"]')).toHaveCount(0)
  await expect(page.getByText(/new session/i)).toBeVisible()
  await expect(page.locator('[data-component="atoms-composer"]')).toBeVisible()
})
