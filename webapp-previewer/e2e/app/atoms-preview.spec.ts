import fs from "node:fs/promises"
import path from "node:path"
import { expect, test } from "../fixtures"

test("opens a detected html target inside the atoms preview canvas", async ({ page, project }) => {
  await project.open({
    setup: async (dir) => {
      await fs.writeFile(
        path.join(dir, "index.html"),
        [
          "<!doctype html>",
          '<html lang="en">',
          "  <head>",
          '    <meta charset="utf-8" />',
          "    <title>Preview Smoke</title>",
          "  </head>",
          "  <body>",
          '    <main id="app">preview smoke</main>',
          "  </body>",
          "</html>",
        ].join("\n"),
        "utf8",
      )
    },
  })

  const preview = page.locator('[data-component="atoms-preview"]')
  await expect(preview).toBeVisible()
  await expect(preview.getByRole("button", { name: "Desktop" })).toBeVisible()
  await expect(page.getByText("7 targets").first()).toBeVisible()
  const entry = preview.getByRole("button", { name: /^index\.html index\.html$/i })
  await expect(entry).toBeVisible()

  await entry.click()

  await expect(preview.locator('iframe[title="Atoms preview"]')).toBeVisible()
  await expect(page.frameLocator('[data-component="atoms-preview"] iframe[title="Atoms preview"]').getByText("preview smoke")).toBeVisible()
})
