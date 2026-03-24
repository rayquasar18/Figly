import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const configService = app.get(ConfigService);

  const port = configService.get<number>('port', 4000);
  const frontendUrl = configService.get<string>('frontendUrl', 'http://localhost:3000');

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  app.use(cookieParser());

  // Swagger/OpenAPI documentation setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Figly API')
    .setDescription('Figly backend API documentation')
    .setVersion('2.0')
    .addCookieAuth('access_token')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(document));

  await app.listen(port, '0.0.0.0');
}
bootstrap();
