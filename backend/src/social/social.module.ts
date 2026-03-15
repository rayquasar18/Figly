import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    BullModule.registerQueue({ name: 'notification' }),
  ],
  controllers: [SocialController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}
