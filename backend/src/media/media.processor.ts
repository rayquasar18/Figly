import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as sharp from 'sharp';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage.service';
import { THUMBNAIL_SIZES } from '@figly/shared';

interface MediaJobData {
  mediaId: string;
  originalKey: string;
  userId: string;
}

@Injectable()
export class MediaProcessor {
  private readonly logger = new Logger(MediaProcessor.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async process(job: Job<MediaJobData>): Promise<void> {
    const { mediaId, originalKey } = job.data;
    this.logger.log(`Processing media ${mediaId}`);

    try {
      // Download original from MinIO
      const originalBuffer = await this.storageService.download(originalKey);

      // Generate variants
      const variants: Record<string, string> = {};

      const sizeEntries: Array<[string, number]> = [
        ['thumbnail', THUMBNAIL_SIZES.small],
        ['medium', THUMBNAIL_SIZES.medium],
        ['large', THUMBNAIL_SIZES.large],
      ];

      for (const [name, width] of sizeEntries) {
        const variantKey = originalKey.replace('originals/', `${name}/`);

        const processedBuffer = await (sharp as any)(originalBuffer)
          .resize(width, undefined, { withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        await this.storageService.upload(variantKey, processedBuffer, 'image/webp');
        variants[name] = variantKey;
      }

      // Update media record with variant keys
      await this.prisma.media.update({
        where: { id: mediaId },
        data: {
          thumbnailKey: variants.thumbnail,
          mediumKey: variants.medium,
          largeKey: variants.large,
          status: 'COMPLETED',
        },
      });

      this.logger.log(`Media ${mediaId} processed successfully`);
    } catch (error) {
      this.logger.error(`Failed to process media ${mediaId}: ${error}`);

      // Set status to FAILED
      await this.prisma.media.update({
        where: { id: mediaId },
        data: { status: 'FAILED' },
      });
    }
  }
}
