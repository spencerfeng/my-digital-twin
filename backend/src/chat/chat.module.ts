import { Module } from "@nestjs/common"
import { ChatController } from "./chat.controller"
import { MemoryModule } from "../memory/memory.module"
import { PromptModule } from "../prompt/prompt.module"

@Module({
  imports: [MemoryModule, PromptModule],
  controllers: [ChatController]
})
export class ChatModule { }
