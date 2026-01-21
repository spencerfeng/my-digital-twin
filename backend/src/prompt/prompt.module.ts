import { Module } from "@nestjs/common"
import { PromptService } from "./prompt.service"
import { ResourceModule } from "../resource/resource.module"

@Module({
  imports: [ResourceModule],
  providers: [PromptService],
  exports: [PromptService]
})
export class PromptModule {}
