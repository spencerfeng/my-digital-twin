import { Module } from "@nestjs/common"
import { HealthController } from "./health/health.controller"
import { ChatController } from "./chat/chat.controller"
import { ResourceModule } from "./resource/resource.module"
import { PromptModule } from "./prompt/prompt.module"

@Module({
  imports: [ResourceModule, PromptModule],
  controllers: [HealthController, ChatController],
  providers: []
})
export class AppModule { }
