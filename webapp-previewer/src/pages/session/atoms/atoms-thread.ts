import type { Message, Part, PermissionRequest, QuestionRequest, SessionStatus, TextPart } from "@opencode-ai/sdk/v2"
import { extractPromptFromParts } from "@/utils/prompt"

type Row =
  | {
      kind: "user"
      id: string
      messageID: string
      text: string
    }
  | {
      kind: "assistant"
      id: string
      messageID: string
      text: string
      error?: string
    }
  | {
      kind: "activity"
      id: string
      messageID: string
      title: string
      detail: string
    }
  | {
      kind: "decision"
      id: string
      request: "question" | "permission"
      title: string
      detail: string
    }

const activity = new Set<Part["type"]>([
  "tool",
  "reasoning",
  "patch",
  "step-start",
  "step-finish",
  "retry",
  "compaction",
  "subtask",
])

const text = (parts: Part[]) =>
  parts
    .filter((part): part is TextPart => part.type === "text")
    .filter((part) => !part.synthetic && !part.ignored)
    .map((part) => part.text.trim())
    .filter(Boolean)
    .join("\n\n")

const summary = (part: Part) => {
  if (part.type === "tool") {
    const state = part.state.status
    const title = part.state.status === "running" ? `Running ${part.tool}` : `${part.tool} ${state}`
    const detail =
      part.state.status === "completed"
        ? part.state.title || part.state.output || "Tool finished."
        : part.state.status === "error"
          ? part.state.error
          : part.state.status === "running"
            ? part.state.title || "Tool is in progress."
            : "Tool queued."
    return { title, detail }
  }

  if (part.type === "reasoning") return { title: "Reasoning", detail: part.text }
  if (part.type === "patch") return { title: "Patch", detail: part.files.join(", ") || "Files updated." }
  if (part.type === "step-start") return { title: "Step started", detail: "Working on the next step." }
  if (part.type === "step-finish") return { title: "Step finished", detail: part.reason }
  if (part.type === "retry") return { title: `Retry ${part.attempt}`, detail: part.error.data.message }
  if (part.type === "compaction") {
    return { title: "Context compacted", detail: part.overflow ? "Conversation overflow trimmed." : "Context compressed." }
  }
  if (part.type === "subtask") return { title: "Subtask", detail: part.description || part.prompt }
  return { title: "Activity", detail: "Session activity updated." }
}

const decision = (request: QuestionRequest | PermissionRequest) => {
  if ("questions" in request) {
    const first = request.questions[0]
    return {
      kind: "decision" as const,
      id: `question:${request.id}`,
      request: "question" as const,
      title: first?.header || "Question pending",
      detail: first?.question || "Answer this request in the composer below.",
    }
  }

  return {
    kind: "decision" as const,
    id: `permission:${request.id}`,
    request: "permission" as const,
    title: "Permission required",
    detail:
      request.patterns.length > 0
        ? `Respond in the composer below to allow ${request.permission} for ${request.patterns.join(", ")}.`
        : `Respond in the composer below to allow ${request.permission}.`,
  }
}

export type AtomsRow = Row

const sameRow = (a: Row, b: Row) => {
  if (a.kind !== b.kind) return false
  if (a.id !== b.id) return false
  if (a.kind === "user" && b.kind === "user") return a.messageID === b.messageID && a.text === b.text
  if (a.kind === "assistant" && b.kind === "assistant") {
    return a.messageID === b.messageID && a.text === b.text && a.error === b.error
  }
  if (a.kind === "activity" && b.kind === "activity") {
    return a.messageID === b.messageID && a.title === b.title && a.detail === b.detail
  }
  if (a.kind === "decision" && b.kind === "decision") {
    return a.request === b.request && a.title === b.title && a.detail === b.detail
  }
  return false
}

export function reuseAtomsRows(prev: AtomsRow[], next: AtomsRow[]) {
  if (prev.length === 0) return next

  const map = new Map(prev.map((row) => [`${row.kind}:${row.id}`, row] as const))
  const rows = next.map((row) => {
    const hit = map.get(`${row.kind}:${row.id}`)
    if (!hit) return row
    return sameRow(hit, row) ? hit : row
  })

  if (rows.length === prev.length && rows.every((row, i) => row === prev[i])) return prev
  return rows
}

export function buildAtomsRows(input: {
  messages: Message[]
  partsByMessage: Record<string, Part[] | undefined>
  questionRequest: () => QuestionRequest | undefined
  permissionRequest: () => PermissionRequest | undefined
  sessionStatus?: () => SessionStatus | undefined
}) {
  const rows: Row[] = input.messages.flatMap((message) => {
    const parts = input.partsByMessage[message.id] ?? []

    if (message.role === "user") {
      const prompt = extractPromptFromParts(parts)
        .map((part) => ("content" in part ? part.content : ""))
        .join("")
        .trim()
      return [{ kind: "user", id: message.id, messageID: message.id, text: prompt || "Sent a prompt." }]
    }

    const out: Row[] = []
    const body = text(parts)
    const err = typeof message.error?.data.message === "string" ? message.error.data.message.trim() : undefined
    if (body || err) {
      out.push({
        kind: "assistant",
        id: message.id,
        messageID: message.id,
        text: body || err || "Working...",
        error: err,
      })
    }

    out.push(
      ...parts
        .filter((part) => activity.has(part.type))
        .map((part) => {
          const item = summary(part)
          return {
            kind: "activity" as const,
            id: part.id,
            messageID: message.id,
            title: item.title,
            detail: item.detail,
          }
        }),
    )

    return out
  })

  const status = input.sessionStatus?.()
  if (status?.type === "retry") {
    rows.push({
      kind: "activity",
      id: `status:retry:${status.attempt}`,
      messageID: "",
      title: `Retry ${status.attempt}`,
      detail: status.message,
    })
  }

  const question = input.questionRequest()
  if (question) rows.push(decision(question))

  const permission = input.permissionRequest()
  if (permission) rows.push(decision(permission))

  return rows
}
