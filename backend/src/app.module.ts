import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD, APP_PIPE, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ZodValidationPipe, ZodSerializerInterceptor } from 'nestjs-zod';
import { validateEnv } from './config/env.schema';
import { RedisModule } from './redis/redis.module';
import { RedisService } from './redis/redis.service';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { MediaModule } from './media/media.module';
import { ProfilesModule } from './profiles/profiles.module';
import { SocialModule } from './social/social.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { FeedModule } from './feed/feed.module';
import { CollectionModule } from './collection/collection.module';
import { ChecklistModule } from './checklist/checklist.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
      envFilePath: [
        join(__dirname, '..', '.env'),
        join(__dirname, '..', '..', '.env'),
      ],
    }),
    LoggerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        pinoHttp: {
          level: configService.get('NODE_ENV') === 'production' ? 'info' : 'debug',
          transport:
            configService.get('NODE_ENV') !== 'production'
              ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
              : undefined,
          redact: ['req.headers.authorization', 'req.headers.cookie'],
        },
      }),
      inject: [ConfigService],
    }),
    RedisModule,
    ThrottlerModule.forRootAsync({
      inject: [RedisService],
      useFactory: (redis: RedisService) => ({
        throttlers: [
          { name: 'short', ttl: 60000, limit: 100 },
          { name: 'login', ttl: 60000, limit: 5 },
        ],
        storage: new ThrottlerStorageRedisService(redis),
      }),
    }),
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('redis.url') || 'redis://localhost:6379';
        const url = new URL(redisUrl);
        return {
          connection: {
            host: url.hostname,
            port: parseInt(url.port || '6379', 10),
          },
        };
      },
      inject: [ConfigService],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    MediaModule,
    ProfilesModule,
    SocialModule,
    PostsModule,
    CommentsModule,
    FeedModule,
    CollectionModule,
    ChecklistModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
