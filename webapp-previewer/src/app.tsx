import { createSignal } from "solid-js"
import { ChatPanel } from "./components/chat-panel"
import { RightPanel } from "./components/right-panel"

export default function App() {
  const [leftPanelWidth, setLeftPanelWidth] = createSignal(45)
  const [isResizing, setIsResizing] = createSignal(false)

  const handleResize = (e: MouseEvent) => {
    if (!isResizing()) return
    
    const container = document.getElementById("main-container")
    if (!container) return
    
    const newWidth = (e.clientX / window.innerWidth) * 100
    if (newWidth >= 30 && newWidth <= 70) {
      setLeftPanelWidth(newWidth)
    }
  }

  const startResize = () => {
    setIsResizing(true)
    document.addEventListener("mousemove", handleResize)
    document.addEventListener("mouseup", stopResize)
  }

  const stopResize = () => {
    setIsResizing(false)
    document.removeEventListener("mousemove", handleResize)
    document.removeEventListener("mouseup", stopResize)
  }

  return (
    <div id="main-container" style={{
      display: "flex",
      width: "100vw",
      height: "100vh",
      overflow: "hidden",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      position: "relative",
    }}>
      {/* Left Panel - Chat (Fixed Layout) */}
      <div
        style={{
          width: "350px",
          minWidth: "250px",
          maxWidth: "500px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          borderRadius: "0 12px 12px 0",
          boxShadow: "2px 0 12px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.01)",
          position: "relative",
          zIndex: 10,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <ChatPanel />
      </div>

      {/* Resizer - Hidden but functional */}
      <div
        style={{
          width: "8px",
          height: "100%",
          cursor: "col-resize",
          backgroundColor: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 5,
          flexShrink: 0,
          position: "relative",
        }}
        onMouseDown={startResize}
      >
        <div style={{
          width: "2px",
          height: "40px",
          backgroundColor: "rgba(0, 0, 0, 0.1)",
          borderRadius: "2px",
          transition: "all 0.2s ease",
        }} />
      </div>

      {/* Right Panel - Preview/Editor */}
      <div
        style={{
          flex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          borderRadius: "16px 0 0 16px",
          marginLeft: "-8px",
          paddingLeft: "8px",
          boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.06)",
          transition: "box-shadow 0.3s ease",
          position: "relative",
          zIndex: 1,
          overflow: "hidden",
        }}
      >
        <RightPanel />
      </div>
    </div>
  )
}