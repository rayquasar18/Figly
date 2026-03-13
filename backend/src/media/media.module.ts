import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MediaService } from './media.service';
import { MediaProcessor } from './media.processor';
import { MediaController } from './media.controller';
import { StorageService } from './storage.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'media-processing',
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService, MediaProcessor, StorageService],
  exports: [MediaService, StorageService],
})
export class MediaModule {}
