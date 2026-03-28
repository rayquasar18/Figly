import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Processor('story-cleanup')
export class StoriesCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(StoriesCleanupProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<void> {
    const deleted = await this.prisma.story.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    this.logger.log(`Cleaned up ${deleted.count} expired stories`);
  }
}
