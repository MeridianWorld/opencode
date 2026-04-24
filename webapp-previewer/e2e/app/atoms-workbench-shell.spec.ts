import { expect } from "@playwright/test"
import { test } from "../fixtures"
import { withSession } from "../actions"

test("renders the atoms-v2 workbench frame with three persistent regions", async ({ page, sdk, gotoSession }) => {
  await page.setViewportSize({ width: 1728, height: 1117 })

  await withSession(sdk, `atoms shell ${Date.now()}`, async (session) => {
    await gotoSession(session.id)

    const shell = page.locator('[data-component="atoms-v2-shell"]')
    const pageNode = page.locator('[data-component="atoms-v2-page"]')
    const chat = page.locator('[data-component="atoms-v2-conversation"]')
    const rail = page.locator('[data-component="atoms-v2-spine"]')
    const workbench = page.locator('[data-component="atoms-v2-stage"]')

    await expect(pageNode).toBeVisible()
    await expect(page.locator('[data-component="atoms-v2-toolbar"]')).toBeVisible()
    await expect(shell).toBeVisible()
    await expect(chat).toBeVisible()
    await expect(rail).toBeVisible()
    await expect(workbench).toBeVisible()

    const box = await shell.boundingBox()
    const left = await chat.boundingBox()
    const mid = await rail.boundingBox()
    const right = await workbench.boundingBox()

    expect(box).not.toBeNull()
    expect(left).not.toBeNull()
    expect(mid).not.toBeNull()
    expect(right).not.toBeNull()

    expect(left!.width).toBeGreaterThan(mid!.width * 1.7)
    expect(right!.width).toBeGreaterThan(mid!.width * 3)
    expect(right!.width).toBeGreaterThan(left!.width * 1.2)
    expect(mid!.width).toBeLessThan(left!.width)
    expect(mid!.width).toBeLessThan(right!.width)
  })
})

test("reflows the atoms-v2 shell on smaller desktop widths without clipping the stage", async ({ page, sdk, gotoSession }) => {
  await page.setViewportSize({ width: 1400, height: 1000 })

  await withSession(sdk, `atoms shell ${Date.now()}`, async (session) => {
    await gotoSession(session.id)

    const shell = page.locator('[data-component="atoms-v2-shell"]')
    const chat = page.locator('[data-component="atoms-v2-conversation"]')
    const rail = page.locator('[data-component="atoms-v2-spine"]')
    const workbench = page.locator('[data-component="atoms-v2-stage"]')
    const box = await shell.boundingBox()
    const left = await chat.boundingBox()
    const mid = await rail.boundingBox()
    const right = await workbench.boundingBox()

    expect(box).not.toBeNull()
    expect(left).not.toBeNull()
    expect(mid).not.toBeNull()
    expect(right).not.toBeNull()

    expect(box!.width).toBeLessThanOrEqual(1400)
    expect(left!.x).toBeGreaterThanOrEqual(box!.x)
    expect(mid!.x).toBeGreaterThanOrEqual(box!.x)
    expect(right!.x).toBeGreaterThanOrEqual(box!.x)
    expect(left!.x + left!.width).toBeLessThanOrEqual(box!.x + box!.width)
    expect(mid!.x + mid!.width).toBeLessThanOrEqual(box!.x + box!.width)
    expect(right!.x + right!.width).toBeLessThanOrEqual(box!.x + box!.width)
  })
})
