import { Controller, Post, Body, HttpException, HttpStatus } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { v4 as uuidv4 } from "uuid"
import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from "@langchain/core/messages"
import { MemoryService } from "../memory/memory.service"
import { PromptService } from "../prompt/prompt.service"

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
  async chat(@Body() body: ChatRequest): Promise<ChatResponse> {
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

      // Call Langchain API
      const response = await this.chatModel.invoke(messages)
      const assistantResponse = response.content as string

      // Update conversation history
      const timestamp = new Date().toISOString()
      conversation.push({
        role: "user",
        content: body.message,
        timestamp
      })
      conversation.push({
        role: "assistant",
        content: assistantResponse,
        timestamp
      })

      // Save conversation
      await this.memoryService.saveConversation(sessionId, conversation)

      return {
        response: assistantResponse,
        sessionId
      }
    } catch (error) {
      console.error(`Error in chat endpoint: ${error}`)
      throw new HttpException(
        `Error processing chat request: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }
}
