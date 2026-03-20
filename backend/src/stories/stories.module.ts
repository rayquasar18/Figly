import { Module, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';
import { StoriesCleanupProcessor } from './stories-cleanup.processor';
import { MediaModule } from '../media/media.module';
import { ModerationModule } from '../moderation/moderation.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'story-cleanup' }),
    MediaModule,
    ModerationModule,
  ],
  controllers: [StoriesController],
  providers: [StoriesService, StoriesCleanupProcessor],
  exports: [StoriesService],
})
export class StoriesModule implements OnModuleInit {
  private readonly logger = new Logger(StoriesModule.name);

  constructor(@Inject('BullQueue_story-cleanup') private cleanupQueue: Queue) {}

  async onModuleInit() {
    // Remove existing repeatable jobs to avoid duplicates on restart
    const repeatableJobs = await this.cleanupQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await this.cleanupQueue.removeRepeatableByKey(job.key);
    }
    // Add repeatable cleanup job every 15 minutes
    await this.cleanupQueue.add('cleanup', {}, {
      repeat: { every: 15 * 60 * 1000 },
    });
    this.logger.log('Story cleanup job registered (every 15 min)');
  }
}
