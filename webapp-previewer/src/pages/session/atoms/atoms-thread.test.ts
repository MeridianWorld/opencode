import { describe, expect, test } from "bun:test"
import type { Message, Part, PermissionRequest, QuestionRequest } from "@opencode-ai/sdk/v2"
import { buildAtomsRows, reuseAtomsRows } from "./atoms-thread"

const user = (id: string) => ({
  id,
  sessionID: "s1",
  role: "user",
  time: { created: 1 },
  agent: "build",
  model: { providerID: "opencode", modelID: "big-pickle" },
}) as Message

const assistant = (id: string) => ({
  id,
  sessionID: "s1",
  role: "assistant",
  time: { created: 2 },
  parentID: "u1",
  modelID: "big-pickle",
  providerID: "opencode",
  mode: "chat",
  agent: "build",
  path: { cwd: "/", root: "/" },
  cost: 0,
  tokens: {
    input: 0,
    output: 0,
    reasoning: 0,
    cache: { read: 0, write: 0 },
  },
}) as Message

describe("buildAtomsRows", () => {
  test("maps session content into user assistant activity and decision rows", () => {
    const messages: Message[] = [user("u1"), assistant("a1")]
    const partsByMessage: Record<string, Part[] | undefined> = {
      u1: [
        {
          id: "p1",
          sessionID: "s1",
          messageID: "u1",
          type: "text",
          text: "hello atoms",
        },
      ],
      a1: [
        {
          id: "p2",
          sessionID: "s1",
          messageID: "a1",
          type: "text",
          text: "working on it",
        },
        {
          id: "p3",
          sessionID: "s1",
          messageID: "a1",
          type: "tool",
          callID: "c1",
          tool: "edit",
          state: {
            status: "running",
            input: {},
            time: { start: 2 },
          },
        },
      ],
    }
    const questionRequest = (): QuestionRequest => ({
      id: "q1",
      sessionID: "s1",
      questions: [
        {
          header: "Direction",
          question: "Which direction should we take?",
          options: [{ label: "A", description: "Option A" }],
        },
      ],
    })
    const permissionRequest = (): PermissionRequest | undefined => undefined

    const rows = buildAtomsRows({
      messages,
      partsByMessage,
      questionRequest,
      permissionRequest,
    })

    expect(rows.map((row) => row.kind)).toEqual(["user", "assistant", "activity", "decision"])
    expect(rows[0]).toMatchObject({ kind: "user", id: "u1", text: "hello atoms" })
    expect(rows[1]).toMatchObject({ kind: "assistant", id: "a1", text: "working on it" })
    expect(rows[2]).toMatchObject({ kind: "activity", messageID: "a1" })
    expect(rows[3]).toMatchObject({ kind: "decision", id: "question:q1", request: "question" })
  })

  test("maps permission requests into decision rows", () => {
    const permissionRequest = (): PermissionRequest => ({
      id: "perm1",
      sessionID: "s1",
      permission: "edit",
      patterns: ["src/**"],
      metadata: {},
      always: [],
    })

    const rows = buildAtomsRows({
      messages: [],
      partsByMessage: {},
      questionRequest: () => undefined,
      permissionRequest,
    })

    expect(rows).toEqual([
      expect.objectContaining({
        kind: "decision",
        id: "permission:perm1",
        request: "permission",
      }),
    ])
  })

  test("falls back to assistant error text when no assistant text part exists", () => {
    const msg = {
      ...assistant("a2"),
      error: {
        name: "UnknownError",
        data: {
          message: "agent failed",
        },
      },
    } as Message

    const rows = buildAtomsRows({
      messages: [msg],
      partsByMessage: { a2: [] },
      questionRequest: () => undefined,
      permissionRequest: () => undefined,
    })

    expect(rows).toEqual([
      expect.objectContaining({
        kind: "assistant",
        id: "a2",
        text: "agent failed",
        error: "agent failed",
      }),
    ])
  })

  test("adds a retry activity row from session status", () => {
    const rows = buildAtomsRows({
      messages: [],
      partsByMessage: {},
      questionRequest: () => undefined,
      permissionRequest: () => undefined,
      sessionStatus: () => ({
        type: "retry",
        attempt: 2,
        message: "provider asked for another attempt",
        next: Date.now() + 1000,
      }),
    })

    expect(rows).toEqual([
      expect.objectContaining({
        kind: "activity",
        id: "status:retry:2",
        title: "Retry 2",
        detail: "provider asked for another attempt",
      }),
    ])
  })
})

describe("reuseAtomsRows", () => {
  test("reuses unchanged row objects by key and content", () => {
    const prev = buildAtomsRows({
      messages: [user("u1"), assistant("a1")],
      partsByMessage: {
        u1: [{ id: "p1", sessionID: "s1", messageID: "u1", type: "text", text: "hello atoms" }],
        a1: [{ id: "p2", sessionID: "s1", messageID: "a1", type: "text", text: "working on it" }],
      },
      questionRequest: () => undefined,
      permissionRequest: () => undefined,
    })

    const next = buildAtomsRows({
      messages: [user("u1"), assistant("a1")],
      partsByMessage: {
        u1: [{ id: "p1", sessionID: "s1", messageID: "u1", type: "text", text: "hello atoms" }],
        a1: [{ id: "p2", sessionID: "s1", messageID: "a1", type: "text", text: "working on it" }],
      },
      questionRequest: () => undefined,
      permissionRequest: () => undefined,
    })

    const rows = reuseAtomsRows(prev, next)

    expect(rows[0]).toBe(prev[0])
    expect(rows[1]).toBe(prev[1])
  })

  test("replaces rows whose content changes", () => {
    const prev = buildAtomsRows({
      messages: [assistant("a1")],
      partsByMessage: {
        a1: [{ id: "p2", sessionID: "s1", messageID: "a1", type: "text", text: "working on it" }],
      },
      questionRequest: () => undefined,
      permissionRequest: () => undefined,
    })

    const next = buildAtomsRows({
      messages: [assistant("a1")],
      partsByMessage: {
        a1: [{ id: "p2", sessionID: "s1", messageID: "a1", type: "text", text: "updated text" }],
      },
      questionRequest: () => undefined,
      permissionRequest: () => undefined,
    })

    const rows = reuseAtomsRows(prev, next)

    expect(rows[0]).not.toBe(prev[0])
    expect(rows[0]).toMatchObject({ text: "updated text" })
  })
})
