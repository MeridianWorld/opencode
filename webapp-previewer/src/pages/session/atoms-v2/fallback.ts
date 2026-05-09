import { base64Encode } from "@opencode-ai/util/encode"

const dir = "Demo workspace"
const session = "demo"

export function pick(input: { project?: string; fallback: string }) {
  const dir = input.project?.trim()
  if (dir) return dir
  return input.fallback
}

export function demo() {
  return dir
}

export function isDemo(input?: string) {
  return input === dir || input === demo()
}

export function demoRoute() {
  return `/${base64Encode(demo())}/session/${session}`
}
