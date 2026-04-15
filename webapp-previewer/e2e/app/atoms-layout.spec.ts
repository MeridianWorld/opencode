import { expect } from "@playwright/test"
import { test } from "../fixtures"
import { withSession } from "../actions"

test("renders the atoms workspace shell around the routed session", async ({ page, sdk, gotoSession }) => {
  await withSession(sdk, `atoms layout ${Date.now()}`, async (session) => {
    await gotoSession(session.id)
    await expect(page.locator('[data-component="atoms-shell"]')).toBeVisible()
    await expect(page.locator('[data-component="atoms-stage"]')).toBeVisible()
    await expect(page.locator('[data-component="atoms-rail"]')).toBeVisible()
    await expect(page.locator('[data-component="atoms-topbar"]')).toBeVisible()
    await expect(page.locator('[data-component="atoms-side"]')).toBeVisible()
    await expect(page.locator('[data-component="atoms-composer"]')).toBeVisible()
  })
})
