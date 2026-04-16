import { describe, expect, test } from "bun:test"
import { box } from "./atoms-preview-layout"

describe("atoms preview sizing", () => {
  test("keeps the preview card stretched to the workspace canvas", () => {
    expect(box("390px")).toEqual({
      width: "390px",
      "max-width": "100%",
      height: "100%",
      "min-height": "28rem",
      "max-height": "56rem",
    })
  })
})
