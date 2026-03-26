import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ZodValidationPipe } from 'nestjs-zod';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('port', 4000);
  const frontendUrl = configService.get<string>('frontendUrl', 'http://localhost:3000');

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // Cookie parser
  app.use(cookieParser());

  // Global Zod validation pipe (replaces class-validator ValidationPipe)
  app.useGlobalPipes(new ZodValidationPipe());

  await app.listen(port, '0.0.0.0');
  console.log(`NestJS server running on port ${port}`);
}
bootstrap();
