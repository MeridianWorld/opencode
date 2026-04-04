import { useEffect, useState } from "react"
import { useStore } from "../store/useStore"
import { Activity, AlertTriangle, Layers, Code } from "lucide-react"
import ReactDiffViewer from "react-diff-viewer-continued"
import { format } from "date-fns"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function Dashboard() {
  const { isConnected, connect, sessions, activeSessionId, timeline, setActiveSession } = useStore()
  const [selectedEvent, setSelectedEvent] = useState<any>(null)

  useEffect(() => {
    connect()
  }, [connect])

  const activeSession = activeSessionId ? sessions[activeSessionId] : null

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
    <div className="flex h-full w-full">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h1 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600" />
            Agent Context
          </h1>
          <div
            className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
            title={isConnected ? "Connected" : "Disconnected"}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Sessions</h2>
          {Object.values(sessions).length === 0 ? (
            <div className="text-xs text-gray-400 px-2 mt-4 text-center">
              No sessions found.
              <br />
              Start using opencode to see them here!
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
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* Header Stats */}
        <div className="h-48 bg-white border-b border-gray-200 p-4 flex gap-4">
          <div className="w-1/3 flex flex-col gap-2">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex-1 flex flex-col justify-center">
              <div className="text-sm text-purple-600 font-medium">Total Session Tokens</div>
              <div className="text-3xl font-bold text-purple-900">{totalTokens.toLocaleString()}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex-1 flex items-center justify-between">
              <div className="text-sm text-gray-600 font-medium">Messages</div>
              <div className="font-bold text-gray-900">
                {activeSession ? Object.keys(activeSession.messages || {}).length : 0}
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white border border-gray-100 rounded-lg p-2 min-h-0">
            <h3 className="text-xs font-semibold text-gray-500 mb-2">Token Usage Trend</h3>
            <div className="h-full min-h-[100px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tokenData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={40} />
                  <Tooltip />
                  <Line type="monotone" dataKey="tokens" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Timeline */}
          <div className="w-1/2 border-r border-gray-200 overflow-y-auto p-4 bg-white">
            <h3 className="text-sm font-bold text-gray-800 mb-4 sticky top-0 bg-white z-10 pb-2">Event Timeline</h3>
            <div className="space-y-3">
              {timeline
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
                ))}
            </div>
          </div>

          {/* Details / Diff */}
          <div className="w-1/2 overflow-y-auto bg-gray-50 p-4">
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
