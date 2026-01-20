import { Module } from "@nestjs/common"
import { HealthController } from "./health/health.controller"
import { ChatController } from "./chat/chat.controller"

@Module({
  imports: [],
  controllers: [HealthController, ChatController],
  providers: []
})
export class AppModule {}
