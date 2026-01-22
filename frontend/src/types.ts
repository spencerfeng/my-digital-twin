export interface ChatRequest {
  message: string
  sessionId?: string
}

export interface ChatResponse {
  response: string
  sessionId: string
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp?: string
}
