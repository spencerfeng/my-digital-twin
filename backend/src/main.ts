import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Enable CORS
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true
  })

  await app.listen(3000)
}
bootstrap()
