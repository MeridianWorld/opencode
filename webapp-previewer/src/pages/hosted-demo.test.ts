import { describe, expect, it } from "bun:test"

describe("HostedDemo composer", () => {
  it("uses an editable prompt textarea instead of a static shell", async () => {
    const src = await Bun.file(new URL("./hosted-demo.tsx", import.meta.url)).text()

    expect(src).toContain("export function DemoComposer")
    expect(src).toContain("<textarea")
    expect(src).toContain('aria-label="Prompt"')
    expect(src).toContain("onInput")
    expect(src).not.toContain('<div class="atoms-v2-demo-composer__input"')
  })
})
