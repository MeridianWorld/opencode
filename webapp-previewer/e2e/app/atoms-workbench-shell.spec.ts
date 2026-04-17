import { expect } from "@playwright/test"
import { test } from "../fixtures"
import { withSession } from "../actions"

test("renders the atoms work-page frame with three persistent regions", async ({ page, sdk, gotoSession }) => {
  await page.setViewportSize({ width: 2048, height: 1003 })

  await withSession(sdk, `atoms shell ${Date.now()}`, async (session) => {
    await gotoSession(session.id)

    const shell = page.locator('[data-component="atoms-shell"]')
    const pageNode = page.locator('[data-component="atoms-page"]')
    const chat = page.locator('[data-component="atoms-chat"]')
    const rail = page.locator('[data-component="atoms-rail"]')
    const workbench = page.locator('[data-component="atoms-workbench"]')

    await expect(pageNode).toBeVisible()
    await expect(shell).toBeVisible()
    await expect(chat).toBeVisible()
    await expect(rail).toBeVisible()
    await expect(workbench).toBeVisible()
    await expect(chat.locator("article").getByText(/^OpenCode$/i)).toHaveCount(0)

    await expect(page.getByText(/the left conversation stays official/i)).toHaveCount(0)
    await expect(page.getByText(/OpenCode page with themed inserts/i)).toHaveCount(0)

    const box = await shell.boundingBox()
    const left = await chat.boundingBox()
    const mid = await rail.boundingBox()
    const right = await workbench.boundingBox()

    expect(box).not.toBeNull()
    expect(left).not.toBeNull()
    expect(mid).not.toBeNull()
    expect(right).not.toBeNull()

    expect(left!.width).toBeGreaterThan(mid!.width * 2)
    expect(right!.width).toBeGreaterThan(mid!.width * 2)
    expect(right!.width).toBeGreaterThan(left!.width * 0.9)
    expect(mid!.width).toBeLessThan(left!.width)
    expect(mid!.width).toBeLessThan(right!.width)
  })
})

test("reflows the atoms shell on smaller desktop widths without clipping the workbench", async ({ page, sdk, gotoSession }) => {
  await page.setViewportSize({ width: 1024, height: 1003 })

  await withSession(sdk, `atoms shell ${Date.now()}`, async (session) => {
    await gotoSession(session.id)

    const shell = page.locator('[data-component="atoms-shell"]')
    const box = await shell.boundingBox()

    expect(box).not.toBeNull()
    expect(box!.width).toBeLessThanOrEqual(1024)
  })
})
