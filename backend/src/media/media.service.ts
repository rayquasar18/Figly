import {
  Injectable,
  BadRequestException,
  PayloadTooLargeException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage.service';
import { FILE_LIMITS } from '@figly/shared';

@Injectable()
export class MediaService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    @Inject('BullQueue_media-processing') private mediaQueue: Queue,
  ) {}

  async upload(file: Express.Multer.File, userId: string) {
    // Validate mimetype is image
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Chi chap nhan file hinh anh');
    }

    // Validate size
    if (file.size > FILE_LIMITS.image) {
      throw new PayloadTooLargeException(
        `File khong duoc vuot qua ${FILE_LIMITS.image / (1024 * 1024)}MB`,
      );
    }

    // Generate storage key
    const key = `originals/${userId}/${randomUUID()}-${file.originalname}`;

    // Upload original to MinIO
    await this.storageService.upload(key, file.buffer, file.mimetype);

    // Create Media record
    const media = await this.prisma.media.create({
      data: {
        userId,
        originalKey: key,
        mimeType: file.mimetype,
        size: file.size,
        status: 'PROCESSING',
      },
    });

    // Queue processing job
    await this.mediaQueue.add('process-media', {
      mediaId: media.id,
      originalKey: key,
      userId,
    });

    return media;
  }

  async getMedia(mediaId: string, userId: string) {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media || media.userId !== userId) {
      throw new NotFoundException('Media khong ton tai');
    }

    // Generate presigned URLs for available variants
    const urls: Record<string, string | null> = {
      original: await this.storageService.getPresignedUrl(media.originalKey),
      thumbnail: media.thumbnailKey
        ? await this.storageService.getPresignedUrl(media.thumbnailKey)
        : null,
      medium: media.mediumKey ? await this.storageService.getPresignedUrl(media.mediumKey) : null,
      large: media.largeKey ? await this.storageService.getPresignedUrl(media.largeKey) : null,
    };

    return { media, urls };
  }

  async getMediaStatus(mediaId: string) {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
      select: { status: true },
    });

    if (!media) {
      throw new NotFoundException('Media khong ton tai');
    }

    return { status: media.status };
  }
}
