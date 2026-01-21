import { Injectable } from "@nestjs/common"
import * as fs from "fs/promises"
import * as path from "path"

export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
  [key: string]: unknown
}

@Injectable()
export class MemoryService {
  private readonly memoryDir: string

  constructor() {
    // Store conversations in a 'memory' directory at the project root
    this.memoryDir = path.join(process.cwd(), "memory")
  }

  private getMemoryPath(sessionId: string): string {
    return path.join(this.memoryDir, `${sessionId}.json`)
  }

  async loadConversation(sessionId: string): Promise<ChatMessage[]> {
    try {
      const filePath = this.getMemoryPath(sessionId)
      const content = await fs.readFile(filePath, "utf-8")
      return JSON.parse(content) as ChatMessage[]
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        // File doesn't exist, return empty array
        return []
      }
      throw error
    }
  }

  async saveConversation(sessionId: string, messages: ChatMessage[]): Promise<void> {
    try {
      // Ensure memory directory exists
      await fs.mkdir(this.memoryDir, { recursive: true })

      const filePath = this.getMemoryPath(sessionId)
      const content = JSON.stringify(messages, null, 2)
      await fs.writeFile(filePath, content, "utf-8")
    } catch (error) {
      throw new Error(`Failed to save conversation for session ${sessionId}: ${error}`)
    }
  }

  async deleteConversation(sessionId: string): Promise<void> {
    try {
      const filePath = this.getMemoryPath(sessionId)
      await fs.unlink(filePath)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        // File doesn't exist, that's fine
        return
      }
      throw error
    }
  }
}
