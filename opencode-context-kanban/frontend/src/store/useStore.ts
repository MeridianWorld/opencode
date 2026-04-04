import { create } from "zustand"

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

export interface StoreState {
  sessions: Record<string, Session>
  activeSessionId: string | null
  timeline: any[]
  isConnected: boolean
  setActiveSession: (id: string) => void
  connect: () => void
}

export const useStore = create<StoreState>((set, get) => ({
  sessions: {},
  activeSessionId: null,
  timeline: [],
  isConnected: false,
  setActiveSession: (id) => set({ activeSessionId: id }),
  connect: () => {
    const ws = new WebSocket("ws://localhost:8000/ws")

    ws.onopen = () => {
      set({ isConnected: true })
      console.log("Connected to backend WS")
    }

    ws.onclose = () => {
      set({ isConnected: false })
      console.log("Disconnected from backend WS, reconnecting...")
      setTimeout(() => get().connect(), 3000)
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
          }
          // etc... handling removed

          return { sessions, timeline: newTimeline }
        })
      }
    }
  },
}))
