import { Controller, Post, Body } from "@nestjs/common"

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  response: string;
}

@Controller()
export class ChatController {
  @Post("chat")
  async chat(@Body() body: ChatRequest): Promise<ChatResponse> {
    // TODO: Implement chat logic with Langchain
    return {
      response: `Echo: ${body.message}`
    }
  }
}
