export function pick(input: { project?: string; fallback: string }) {
  const dir = input.project?.trim()
  if (dir) return dir
  return input.fallback
}

export function demo() {
  return import.meta.env.VITE_OPENCODE_ATOMS_DEMO_DIR
}
