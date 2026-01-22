import type { ChatMessage as ChatMessageType } from "../types"
import { Bot } from "lucide-react"

interface ChatMessageProps {
  message: ChatMessageType
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div
      className={`flex flex-col max-w-[75%] ${
        isUser ? "ml-auto items-end" : "mr-auto items-start"
      }`}
    >
      <div
        className={`flex items-center gap-1 text-xs font-semibold mb-1 opacity-70 px-1 ${
          isUser ? "text-blue-400" : "text-green-400"
        }`}
      >
        {isUser ? "You" : <Bot size={16} />}
      </div>
      <div
        className={`px-4 py-3 rounded-2xl whitespace-pre-wrap break-words ${
          isUser
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-gray-700 text-gray-100 rounded-bl-md"
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}
