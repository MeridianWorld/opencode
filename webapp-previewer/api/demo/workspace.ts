import { payload } from "../../src/pages/session/atoms-v2/demo-api.js"

type Req = {
  method?: string
}

type Json = {
  json(data: unknown): void
}

type Res = {
  setHeader(name: string, value: string): void
  status(code: number): Json
}

export default function handler(req: Req, res: Res) {
  if (req.method && req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" })
    return
  }

  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60")
  res.status(200).json(payload())
}
