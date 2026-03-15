import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ConversationsService } from './conversations.service';
import { MessagesService } from './messages.service';
import { MessagingGateway } from './messaging.gateway';
import { ConversationsController } from './conversations.controller';
import { MediaModule } from '../media/media.module';
import { ModerationModule } from '../moderation/moderation.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.accessSecret'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: 'notification' }),
    MediaModule,
    ModerationModule,
    AuthModule,
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService, MessagesService, MessagingGateway],
  exports: [MessagingGateway],
})
export class MessagingModule {}
