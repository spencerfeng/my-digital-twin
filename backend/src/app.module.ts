import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { HealthController } from "./health/health.controller"
import { ResourceModule } from "./resource/resource.module"
import { ChatModule } from "./chat/chat.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env"
    }),
    ResourceModule,
    ChatModule
  ],
  controllers: [HealthController],
  providers: []
})
export class AppModule { }
