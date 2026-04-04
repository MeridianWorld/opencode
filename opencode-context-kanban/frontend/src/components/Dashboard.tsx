import { useEffect, useRef, useState } from "react"
import { useStore } from "../store/useStore"
import { Activity, AlertTriangle, Layers, Code } from "lucide-react"
import ReactDiffViewer from "react-diff-viewer-continued"
import { format } from "date-fns"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

export default function Dashboard() {
  const { isConnected, connect, sessions, activeSessionId, timeline, setActiveSession, sseStatus } = useStore()
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const chartContainerRef = useRef<HTMLDivElement | null>(null)
  const [chartWidth, setChartWidth] = useState(0)

  useEffect(() => {
    connect()
  }, [connect])

  useEffect(() => {
    const element = chartContainerRef.current
    if (!element) {
      return
    }

    const updateWidth = () => {
      setChartWidth(Math.floor(element.getBoundingClientRect().width))
    }

    updateWidth()

    const observer = new ResizeObserver(() => {
      updateWidth()
    })
    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [activeSessionId])

  const activeSession = activeSessionId ? sessions[activeSessionId] : null

  // Determine connection status for empty states
  const connectionState = !isConnected
    ? "backend_disconnected"
    : !sseStatus.connected
      ? "sse_disconnected"
      : !sseStatus.has_received_event
        ? "waiting_for_events"
        : "connected"

  // Compute tokens for chart
  const tokenData = activeSession
    ? Object.values(activeSession.messages || {})
        .map((msg: any) => {
          return {
            name: msg.id.slice(0, 8),
            tokens: msg.tokens?.total || (msg.tokens?.input || 0) + (msg.tokens?.output || 0) || 0,
            role: msg.role,
          }
        })
        .filter((d) => d.tokens > 0)
    : []

  const totalTokens = tokenData.reduce((acc, curr) => acc + curr.tokens, 0)

  return (
    <div className="flex h-full w-full flex-col lg:flex-row">
      {/* Sidebar */}
      <div className="w-full lg:w-64 lg:min-w-64 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" />
              Agent Context
            </h1>
            <div
              className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
              title={isConnected ? "Backend websocket connected" : "Backend websocket disconnected"}
            />
          </div>
          <div className="text-xs">
            {!isConnected ? (
              <div className="text-red-600 font-medium">Connecting to backend...</div>
            ) : !sseStatus.connected ? (
              <div className="text-amber-600 font-medium">Upstream SSE disconnected</div>
            ) : !sseStatus.has_received_event ? (
              <div className="text-blue-600 font-medium">Connected, waiting for events...</div>
            ) : (
              <div className="text-green-600 font-medium">Receiving live events</div>
            )}
            {sseStatus.last_error && (
              <div className="text-red-500 mt-1 truncate" title={sseStatus.last_error}>
                Error:{" "}
                {sseStatus.last_error.length > 50
                  ? sseStatus.last_error.substring(0, 50) + "..."
                  : sseStatus.last_error}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Sessions</h2>
          {Object.values(sessions).length === 0 ? (
            <div className="text-xs text-gray-400 px-2 mt-4 text-center">
              {!isConnected ? (
                <>Connecting to backend...</>
              ) : !sseStatus.connected ? (
                <>Upstream SSE disconnected. Check if opencode is running.</>
              ) : !sseStatus.has_received_event ? (
                <>Connected to opencode. Waiting for first event...</>
              ) : (
                <>No sessions found. Start using opencode to see them here!</>
              )}
            </div>
          ) : (
            Object.values(sessions).map((session) => (
              <button
                key={session.id}
                onClick={() => setActiveSession(session.id)}
                className={`w-full text-left px-3 py-2 rounded-md mb-1 text-sm ${
                  activeSessionId === session.id
                    ? "bg-purple-100 text-purple-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <div className="truncate">{session.title || session.id}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col bg-gray-50 overflow-hidden">
        {/* Header Stats */}
        <div className="bg-white border-b border-gray-200 p-4 flex flex-col lg:flex-row gap-4">
          <div className="w-full lg:w-1/3 flex flex-col gap-2">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex-1 flex flex-col justify-center">
              <div className="text-sm text-purple-600 font-medium">Total Session Tokens</div>
              {Object.values(sessions).length === 0 ? (
                <div className="text-lg text-gray-500 font-medium">
                  {connectionState === "backend_disconnected"
                    ? "Connecting..."
                    : connectionState === "sse_disconnected"
                      ? "SSE disconnected"
                      : connectionState === "waiting_for_events"
                        ? "Waiting for events"
                        : "No data"}
                </div>
              ) : (
                <div className="text-3xl font-bold text-purple-900">{totalTokens.toLocaleString()}</div>
              )}
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex-1 flex items-center justify-between">
              <div className="text-sm text-gray-600 font-medium">Messages</div>
              <div className="font-bold text-gray-900">
                {activeSession ? Object.keys(activeSession.messages || {}).length : 0}
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0 bg-white border border-gray-100 rounded-lg p-2 min-h-0">
            <h3 className="text-xs font-semibold text-gray-500 mb-2">Token Usage Trend</h3>
            <div ref={chartContainerRef} className="h-full min-h-[100px] w-full relative">
              {Object.values(sessions).length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  {connectionState === "backend_disconnected"
                    ? "Connecting to backend..."
                    : connectionState === "sse_disconnected"
                      ? "Upstream SSE disconnected"
                      : connectionState === "waiting_for_events"
                        ? "Connected, waiting for events..."
                        : "No session data available"}
                </div>
              ) : tokenData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  No token data in selected session
                </div>
              ) : chartWidth <= 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">Loading chart...</div>
              ) : (
                <LineChart width={chartWidth} height={180} data={tokenData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={40} />
                  <Tooltip />
                  <Line type="monotone" dataKey="tokens" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Split */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-auto lg:overflow-hidden">
          {/* Timeline */}
          <div className="w-full lg:w-1/2 lg:border-r border-gray-200 overflow-y-auto p-4 bg-white">
            <h3 className="text-sm font-bold text-gray-800 mb-4 sticky top-0 bg-white z-10 pb-2">Event Timeline</h3>
            <div className="space-y-3">
              {timeline.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  {connectionState === "backend_disconnected"
                    ? "Connecting to backend..."
                    : connectionState === "sse_disconnected"
                      ? "Upstream SSE disconnected"
                      : connectionState === "waiting_for_events"
                        ? "Connected, waiting for first event..."
                        : "No events received yet"}
                </div>
              ) : (
                timeline
                  .filter(
                    (t) =>
                      !activeSessionId ||
                      t.properties?.info?.sessionID === activeSessionId ||
                      t.properties?.sessionID === activeSessionId ||
                      t.properties?.part?.sessionID === activeSessionId,
                  )
                  .map((event, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedEvent(event)}
                      className={`p-3 rounded-md border cursor-pointer transition-colors ${
                        selectedEvent === event
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-purple-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                          {event.type.includes("removed") || event.type.includes("compacted") ? (
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                          ) : (
                            <Activity className="w-3 h-3 text-blue-500" />
                          )}
                          {event.type}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {format(new Date(event.timestamp), "HH:mm:ss.SSS")}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {event.properties?.info?.role || event.properties?.part?.type || "System Event"}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Details / Diff */}
          <div className="w-full lg:w-1/2 overflow-y-auto bg-gray-50 p-4">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Code className="w-4 h-4" />
              Event Details & Diff
            </h3>
            {selectedEvent ? (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gray-100 p-2 border-b border-gray-200 text-xs font-mono text-gray-600">
                  Payload JSON
                </div>
                <div className="p-4 overflow-x-auto">
                  <pre className="text-xs text-gray-800">{JSON.stringify(selectedEvent.properties, null, 2)}</pre>
                </div>

                {/* Simulated Diff logic based on event type */}
                {selectedEvent.type === "session.compacted" &&
                  (() => {
                    const props = selectedEvent.properties || {}
                    const getStr = (keys: string[]) => {
                      for (const key of keys) {
                        if (props[key] !== undefined) {
                          return typeof props[key] === "string" ? props[key] : JSON.stringify(props[key], null, 2)
                        }
                      }
                      return null
                    }

                    const beforeStr = getStr(["old", "before", "previous", "removed", "compacted"])
                    const afterStr = getStr(["new", "after", "current", "replacement", "summary"])

                    if (beforeStr !== null || afterStr !== null) {
                      return (
                        <div className="border-t border-gray-200">
                          <div className="bg-amber-50 text-amber-700 text-xs font-bold p-2 border-b border-amber-100">
                            Session Compacted (Diff)
                          </div>
                          <ReactDiffViewer
                            oldValue={beforeStr || ""}
                            newValue={afterStr || ""}
                            splitView={true}
                            useDarkTheme={false}
                          />
                        </div>
                      )
                    }

                    return (
                      <div className="border-t border-gray-200">
                        <div className="bg-amber-50 text-amber-700 text-xs font-bold p-2 border-b border-amber-100">
                          Session Compacted (Summary)
                        </div>
                        <div className="p-4 text-sm text-gray-700">
                          The session was compacted to save tokens, but exact before/after details are unavailable.
                        </div>
                      </div>
                    )
                  })()}

                {selectedEvent.type === "message.removed" && (
                  <div className="border-t border-gray-200">
                    <div className="bg-red-50 text-red-700 text-xs font-bold p-2 border-b border-red-100">
                      Message Truncated / Pruned
                    </div>
                    <ReactDiffViewer
                      oldValue={`Message ID: ${selectedEvent.properties.messageID}\n[Content was removed to save tokens]`}
                      newValue={""}
                      splitView={true}
                      useDarkTheme={false}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                Select an event from the timeline to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
