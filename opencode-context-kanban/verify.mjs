import { chromium } from "playwright"
import fs from "fs"
;(async () => {
  console.log("Launching browser...")
  const browser = await chromium.launch()
  const page = await browser.newPage()
  console.log("Navigating to http://127.0.0.1:5175/...")
  try {
    await page.goto("http://127.0.0.1:5175/", { timeout: 15000 })
    const title = await page.title()
    console.log("Page title:", title)

    console.log("Waiting for network to settle...")
    await page.waitForTimeout(3000)

    await page.screenshot({ path: "screenshot.png" })
    console.log("Screenshot saved to screenshot.png")

    const content = await page.content()
    if (content.includes("Agent Context") || content.includes("Dashboard")) {
      console.log("SUCCESS: Agent Context UI found.")
    } else {
      console.log("ERROR: UI not as expected. Content sample:")
      console.log(content.slice(0, 500))
    }
  } catch (e) {
    console.error("Navigation failed:", e.message)
  } finally {
    await browser.close()
  }
})()
