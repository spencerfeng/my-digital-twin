import type { ChatRequest, ChatResponse } from "../types"

const API_BASE_URL = "http://localhost:3000"

export class ChatService {
  private sessionId: string | null = null

  async sendMessage(message: string): Promise<ChatResponse> {
    const request: ChatRequest = {
      message,
      sessionId: this.sessionId || undefined
    }

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to send message: ${error}`)
    }

    const data: ChatResponse = await response.json()

    // Store session ID for subsequent requests
    if (data.sessionId) {
      this.sessionId = data.sessionId
    }

    return data
  }

  getSessionId(): string | null {
    return this.sessionId
  }

  resetSession(): void {
    this.sessionId = null
  }
}
