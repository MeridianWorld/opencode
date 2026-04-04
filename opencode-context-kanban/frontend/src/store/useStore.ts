import { create } from "zustand"

let activeWebSocket: WebSocket | null = null
let reconnectTimer: number | null = null
let isConnecting = false

export interface TokenCount {
  input: number
  output: number
  total: number
}

export interface Part {
  id: string
  type: string
  text?: string
  [key: string]: any
}

export interface Message {
  id: string
  role: string
  agent: string
  parts: Record<string, Part>
  tokens?: TokenCount
  time?: { start?: number; end?: number; created?: number }
}

export interface Session {
  id: string
  title?: string
  messages: Record<string, Message>
}

export interface SseStatus {
  connected: boolean
  last_error: string | null
  has_received_event: boolean
  last_connection_time: number | null
}

export interface StoreState {
  sessions: Record<string, Session>
  activeSessionId: string | null
  timeline: any[]
  isConnected: boolean
  sseStatus: SseStatus
  setActiveSession: (id: string) => void
  connect: () => void
}

export const useStore = create<StoreState>((set, get) => ({
  sessions: {},
  activeSessionId: null,
  timeline: [],
  isConnected: false,
  sseStatus: {
    connected: false,
    last_error: null,
    has_received_event: false,
    last_connection_time: null,
  },
  setActiveSession: (id) => set({ activeSessionId: id }),
  connect: () => {
    if (activeWebSocket && (activeWebSocket.readyState === WebSocket.OPEN || activeWebSocket.readyState === WebSocket.CONNECTING)) {
      return
    }

    if (isConnecting) {
      return
    }

    isConnecting = true
    const ws = new WebSocket("ws://localhost:8000/ws")
    activeWebSocket = ws

    ws.onopen = () => {
      isConnecting = false
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      set({ isConnected: true })
      console.log("Connected to backend WS")
    }

    ws.onclose = () => {
      if (activeWebSocket === ws) {
        activeWebSocket = null
      }
      isConnecting = false
      set({ isConnected: false })
      console.log("Disconnected from backend WS, reconnecting...")
      if (reconnectTimer === null) {
        reconnectTimer = window.setTimeout(() => {
          reconnectTimer = null
          get().connect()
        }, 3000)
      }
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === "snapshot") {
        const data = msg.data
        const sessions = { ...data.sessions }

        // Populate messages into sessions
        for (const [sid, msgs] of Object.entries(data.messages as Record<string, any>)) {
          if (!sessions[sid]) sessions[sid] = { id: sid, messages: {} }
          else sessions[sid].messages = { ...msgs }

          // Populate parts into messages
          if (data.parts[sid]) {
            for (const [mid, parts] of Object.entries(data.parts[sid] as Record<string, any>)) {
              if (sessions[sid].messages[mid]) {
                sessions[sid].messages[mid].parts = parts
              }
            }
          }
        }

        set((state) => ({
          sessions,
          timeline: data.timeline || [],
          activeSessionId: state.activeSessionId || Object.keys(sessions)[0] || null,
          sseStatus: data.sse_status || state.sseStatus,
        }))
      } else if (msg.type === "event") {
        // Handle incremental events
        const payload = msg.data
        const eventType = payload.type
        const props = payload.properties

        set((state) => {
          const newTimeline = [...state.timeline, { type: eventType, properties: props, timestamp: Date.now() }]
          if (newTimeline.length > 2000) newTimeline.shift()

          const sessions = { ...state.sessions }

          if (eventType === "session.created" || eventType === "session.updated") {
            const sid = props.info.id
            if (!sessions[sid]) sessions[sid] = { ...props.info, messages: {} }
            else sessions[sid] = { ...sessions[sid], ...props.info }

            if (!state.activeSessionId) state.activeSessionId = sid
          } else if (eventType === "message.updated") {
            const sid = props.info.sessionID
            const mid = props.info.id
            if (sessions[sid]) {
              sessions[sid].messages = { ...sessions[sid].messages }
              const oldParts = sessions[sid].messages[mid]?.parts || {}
              sessions[sid].messages[mid] = { ...props.info, parts: oldParts }
            }
          } else if (eventType === "message.part.updated") {
            const sid = props.part.sessionID
            const mid = props.part.messageID
            const pid = props.part.id
            if (sessions[sid] && sessions[sid].messages[mid]) {
              sessions[sid].messages[mid].parts = { ...sessions[sid].messages[mid].parts }
              sessions[sid].messages[mid].parts[pid] = props.part
            }
          } else if (eventType === "message.removed") {
            const sid = props.sessionID
            const mid = props.messageID
            if (sessions[sid]?.messages[mid]) {
              sessions[sid] = {
                ...sessions[sid],
                messages: { ...sessions[sid].messages },
              }
              delete sessions[sid].messages[mid]
            }
          } else if (eventType === "message.part.removed") {
            const sid = props.sessionID
            const mid = props.messageID
            const pid = props.partID
            if (sessions[sid]?.messages[mid]?.parts?.[pid]) {
              sessions[sid] = {
                ...sessions[sid],
                messages: { ...sessions[sid].messages },
              }
              sessions[sid].messages[mid] = {
                ...sessions[sid].messages[mid],
                parts: { ...sessions[sid].messages[mid].parts },
              }
              delete sessions[sid].messages[mid].parts[pid]
            }
          }

          return { sessions, timeline: newTimeline }
        })
      } else if (msg.type === "sse_status") {
        set({ sseStatus: msg.data })
      }
    }
  },
}))
