import type { ChatRequest } from "../types"

const API_BASE_URL = "http://localhost:3000"

export class ChatService {
  private sessionId: string | null = null

  async sendMessage(
    message: string,
    onChunk: (chunk: string) => void
  ): Promise<{ sessionId: string; fullResponse: string }> {
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

    if (!response.body) {
      throw new Error("Response body is null")
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let sessionId = ""
    let fullResponse = ""

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === "sessionId") {
                sessionId = data.sessionId
                if (sessionId) {
                  this.sessionId = sessionId
                }
              } else if (data.type === "chunk") {
                fullResponse += data.content
                onChunk(data.content)
              } else if (data.type === "done") {
                // Streaming complete
              } else if (data.type === "error") {
                throw new Error(data.error)
              }
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    return { sessionId, fullResponse }
  }

  getSessionId(): string | null {
    return this.sessionId
  }

  resetSession(): void {
    this.sessionId = null
  }
}
