import { useState, useRef, useEffect } from "react"
import type { ChatMessage as ChatMessageType } from "../types"
import { ChatService } from "../services/chatService"
import ChatMessage from "./ChatMessage"
import { User } from "lucide-react"

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [chatService] = useState(() => new ChatService())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    const message = input.trim()
    if (!message || isLoading) {
      return
    }

    // Add user message to UI
    const userMessage: ChatMessageType = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString()
    }
    
    // Create placeholder for streaming response
    const assistantMessage: ChatMessageType = {
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString()
    }
    
    // Add both messages at once
    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInput("")
    setIsLoading(true)

    try {
      await chatService.sendMessage(message, (chunk: string) => {
        // Update the last message (assistant message) with streaming content
        setMessages((prev) => {
          const updated = [...prev]
          const lastIndex = updated.length - 1
          const lastMsg = updated[lastIndex]
          if (lastMsg && lastMsg.role === "assistant") {
            updated[lastIndex] = {
              ...lastMsg,
              content: lastMsg.content + chunk
            }
          }
          return updated
        })
      })
    } catch (error) {
      // Update the last message with error
      setMessages((prev) => {
        const updated = [...prev]
        const lastIndex = updated.length - 1
        const lastMsg = updated[lastIndex]
        if (lastMsg && lastMsg.role === "assistant") {
          updated[lastIndex] = {
            ...lastMsg,
            content: `Error: ${error instanceof Error ? error.message : "Failed to send message"}`
          }
        }
        return updated
      })
      console.error("Chat error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    if (confirm("Start a new conversation? This will clear the current chat history.")) {
      setMessages([])
      chatService.resetSession()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col max-h-[90vh] h-[800px] w-full max-w-2xl mx-auto bg-gray-900 rounded-lg overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-gray-600 overflow-hidden bg-gray-700 flex items-center justify-center">
            {avatarError ? (
              <User className="w-6 h-6 text-gray-400" />
            ) : (
              <img
                src="/avatar.jpg"
                alt="Digital Twin"
                className="w-full h-full object-cover"
                onError={() => setAvatarError(true)}
              />
            )}
          </div>
        </div>
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
        >
          New Conversation
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Start a chat</p>
          </div>
        )}
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Container */}
      <div className="flex gap-3 px-6 py-4 bg-gray-800 border-t border-gray-700">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
          disabled={isLoading}
          className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  )
}
