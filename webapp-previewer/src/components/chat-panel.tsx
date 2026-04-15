import { createSignal, For, Show, onMount } from "solid-js"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function ChatPanel() {
  const [messages, setMessages] = createSignal<Message[]>([])
  const [inputValue, setInputValue] = createSignal("")
  const [isLoading, setIsLoading] = createSignal(false)

  onMount(() => {
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: "你好！我是 AI 编程助手。我可以帮你构建 Web 应用、编写代码、调试问题等。请告诉我你想做什么？",
        timestamp: new Date()
      }
    ])
  })

  const sendMessage = async () => {
    const message = inputValue().trim()
    if (!message || isLoading()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `收到你的消息："${message}"。我正在为你处理...`,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error("发送消息失败:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      display: "flex",
      "flex-direction": "column" as any,
      height: "100%",
      width: "100%",
      backgroundColor: "transparent",
      overflow: "hidden",
    }}>
      {/* Header - Fixed Layout */}
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid rgba(0, 0, 0, 0.04)",
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        width: "100%",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #5468ff 0%, #7947d6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "600",
            fontSize: "13px",
            flexShrink: 0,
            boxShadow: "0 1px 3px rgba(84, 104, 255, 0.2)",
          }}>
            AI
          </div>
          <div style={{ minWidth: 0, flex: "1 1 auto" }}>
            <h1 style={{
              margin: 0,
              fontSize: "14px",
              fontWeight: "600",
              color: "#1a1a1a",
              lineHeight: "1.3",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              AI 助手
            </h1>
            <p style={{
              margin: "2px 0 0 0",
              fontSize: "11px",
              color: "#6b7280",
              lineHeight: "1.2",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              在线
            </p>
          </div>
        </div>

        <button
          onClick={() => console.log("预览按钮点击")}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            backgroundColor: "#ffffff",
            color: "#5468ff",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "500",
            transition: "all 0.15s ease",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.08)";
            e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.08)";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
        </button>
      </div>

      {/* Messages Area - Fixed Layout */}
      <div style={{
        flex: "1 1 auto",
        overflowY: "auto",
        overflowX: "hidden",
        padding: "16px",
        display: "flex",
        "flex-direction": "column" as any,
        gap: "12px",
        backgroundColor: "transparent",
        width: "100%",
        minWidth: 0,
      }}>
        <For each={messages()}>
          {(message) => (
            <div style={{
              display: "flex",
              gap: "10px",
              justifyContent: message.role === "user" ? "flex-end" : "flex-start",
              alignItems: "flex-start",
              width: "100%",
            }}>
              <Show when={message.role === "assistant"}>
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #5468ff 0%, #7947d6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "600",
                  fontSize: "12px",
                  flexShrink: 0,
                  boxShadow: "0 1px 2px rgba(84, 104, 255, 0.15)",
                }}>
                  AI
                </div>
              </Show>

              <div style={{
                maxWidth: "80%",
                padding: "10px 14px",
                borderRadius: "12px",
                backgroundColor: message.role === "user" 
                  ? "#5468ff"
                  : "#f5f5f7",
                color: message.role === "user" ? "white" : "#1a1a1a",
                fontSize: "13px",
                lineHeight: "1.5",
                boxShadow: message.role === "user"
                  ? "0 1px 2px rgba(84, 104, 255, 0.2)"
                  : "none",
                wordBreak: "break-word",
                flexShrink: 0,
              }}>
                {message.content}
              </div>

              <Show when={message.role === "user"}>
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  backgroundColor: "#e8e8ed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#6b7280",
                  fontWeight: "600",
                  fontSize: "12px",
                  flexShrink: 0,
                }}>
                  U
                </div>
              </Show>
            </div>
          )}
        </For>

        <Show when={isLoading()}>
          <div style={{
            display: "flex",
            gap: "10px",
            justifyContent: "flex-start",
            width: "100%",
          }}>
            <div style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "600",
              fontSize: "12px",
              flexShrink: 0,
            }}>
              AI
            </div>
            <div style={{
              padding: "10px 14px",
              borderRadius: "12px",
              backgroundColor: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}>
              <div style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "#94a3b8",
                animation: "bounce 1.4s infinite ease-in-out both",
                animationDelay: "-0.32s",
              }} />
              <div style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "#94a3b8",
                animation: "bounce 1.4s infinite ease-in-out both",
                animationDelay: "-0.16s",
              }} />
              <div style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "#94a3b8",
                animation: "bounce 1.4s infinite ease-in-out both",
              }} />
            </div>
          </div>
        </Show>
      </div>

      {/* Input Area - Fixed at Bottom */}
      <div style={{
        padding: "12px 16px",
        borderTop: "1px solid rgba(0, 0, 0, 0.04)",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        flexShrink: 0,
        width: "100%",
      }}>
        <div style={{
          display: "flex",
          gap: "8px",
          alignItems: "flex-end",
          width: "100%",
        }}>
          <textarea
            value={inputValue()}
            onInput={(e) => setInputValue(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="输入消息..."
            rows={1}
            style={{
              flex: "1 1 auto",
              padding: "10px 12px",
              borderRadius: "10px",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              resize: "none",
              outline: "none",
              fontSize: "13px",
              fontFamily: "inherit",
              lineHeight: "1.4",
              maxHeight: "100px",
              minHeight: "40px",
              transition: "all 0.15s ease",
              backgroundColor: "#ffffff",
              width: "100%",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(84, 104, 255, 0.3)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(84, 104, 255, 0.08)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.08)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue().trim() || isLoading()}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: (!inputValue().trim() || isLoading()) 
                ? "#e8e8ed" 
                : "#5468ff",
              color: "white",
              cursor: (!inputValue().trim() || isLoading()) 
                ? "not-allowed" 
                : "pointer",
              fontSize: "13px",
              fontWeight: "500",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              opacity: (!inputValue().trim() || isLoading()) ? 0.6 : 1,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (inputValue().trim() && !isLoading()) {
                e.currentTarget.style.backgroundColor = "#4054e6";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(84, 104, 255, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (inputValue().trim() && !isLoading()) {
                e.currentTarget.style.backgroundColor = "#5468ff";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
        
        /* Custom scrollbar - Atoms.dev style */
        [style*="overflowY: auto"]::-webkit-scrollbar {
          width: 6px;
        }
        
        [style*="overflowY: auto"]::-webkit-scrollbar-track {
          background: transparent;
        }
        
        [style*="overflowY: auto"]::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        
        [style*="overflowY: auto"]::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  )
}