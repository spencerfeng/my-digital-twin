import { Controller, Post, Body, Res } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { v4 as uuidv4 } from "uuid"
import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from "@langchain/core/messages"
import { MemoryService } from "../memory/memory.service"
import { PromptService } from "../prompt/prompt.service"
import { Response } from "express"

export interface ChatRequest {
  message: string
  sessionId?: string
}

export interface ChatResponse {
  response: string
  sessionId: string
}

@Controller()
export class ChatController {
  private readonly chatModel: ChatOpenAI

  constructor(
    private readonly memoryService: MemoryService,
    private readonly promptService: PromptService,
    private readonly configService: ConfigService
  ) {
    // Initialize Langchain ChatOpenAI model
    const apiKey = this.configService.get<string>("OPENAI_API_KEY")
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set")
    }

    this.chatModel = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.7,
      openAIApiKey: apiKey
    })
  }

  @Post("chat")
  async chat(@Body() body: ChatRequest, @Res() res: Response): Promise<void> {
    try {
      // Generate session ID if not provided
      const sessionId = body.sessionId || uuidv4()

      // Load conversation history
      const conversation = await this.memoryService.loadConversation(sessionId)

      // Build messages for Langchain
      const messages: BaseMessage[] = [new SystemMessage(this.promptService.getPrompt())]

      // Add conversation history (keep last 10 messages for context window)
      const recentMessages = conversation.slice(-10)
      for (const msg of recentMessages) {
        if (msg.role === "user") {
          messages.push(new HumanMessage(msg.content))
        } else if (msg.role === "assistant") {
          messages.push(new AIMessage(msg.content))
        }
      }

      // Add current user message
      messages.push(new HumanMessage(body.message))

      // Set up streaming response
      res.setHeader("Content-Type", "text/event-stream")
      res.setHeader("Cache-Control", "no-cache")
      res.setHeader("Connection", "keep-alive")

      // Send session ID first
      res.write(`data: ${JSON.stringify({ type: "sessionId", sessionId })}\n\n`)

      let fullResponse = ""

      // Stream the response from Langchain
      const stream = await this.chatModel.stream(messages)
      for await (const chunk of stream) {
        const content = chunk.content as string
        if (content) {
          fullResponse += content
          res.write(`data: ${JSON.stringify({ type: "chunk", content })}\n\n`)
        }
      }

      // Send completion signal
      res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`)

      // Update conversation history
      const timestamp = new Date().toISOString()
      conversation.push({
        role: "user",
        content: body.message,
        timestamp
      })
      conversation.push({
        role: "assistant",
        content: fullResponse,
        timestamp
      })

      // Save conversation
      await this.memoryService.saveConversation(sessionId, conversation)

      res.end()
    } catch (error) {
      console.error(`Error in chat endpoint: ${error}`)
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          error: error instanceof Error ? error.message : "Failed to process chat request"
        })}\n\n`
      )
      res.end()
    }
  }
}
