import { expect } from "@playwright/test"
import { test } from "../fixtures"
import { withSession } from "../actions"

test("shows the atoms preview workspace in the session shell", async ({ page, sdk, gotoSession }) => {
  await withSession(sdk, `atoms preview ${Date.now()}`, async (session) => {
    await gotoSession(session.id)
    const preview = page.locator('[data-component="atoms-preview"]')
    await expect(preview).toBeVisible()
    await expect(preview.getByRole("button", { name: "Desktop" })).toBeVisible()
  })
})
