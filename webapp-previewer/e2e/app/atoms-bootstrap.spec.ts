import { test, expect } from "../fixtures"
import { withSession } from "../actions"
import { promptSelector } from "../selectors"

test("opens a routed session through the official app shell", async ({ page, sdk, gotoSession }) => {
  const title = `atoms bootstrap ${Date.now()}`

  await withSession(sdk, title, async (session) => {
    await gotoSession(session.id)
    await expect(page.locator(promptSelector)).toBeVisible()
    await expect(page).toHaveURL(/\/session\//)
  })
})
