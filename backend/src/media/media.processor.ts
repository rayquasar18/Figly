import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import * as sharp from 'sharp';
import * as ffmpeg from 'fluent-ffmpeg';
import * as ffprobeInstaller from '@ffprobe-installer/ffprobe';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage.service';
import { THUMBNAIL_SIZES } from '@figly/shared';

ffmpeg.setFfprobePath(ffprobeInstaller.path);

interface MediaJobData {
  mediaId: string;
  originalKey: string;
  userId: string;
  type?: 'image' | 'video';
}

@Processor('media-processing')
export class MediaProcessor extends WorkerHost {
  private readonly logger = new Logger(MediaProcessor.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {
    super();
  }

  async process(job: Job<MediaJobData>): Promise<void> {
    const { mediaId, originalKey } = job.data;
    const jobType = job.data.type || 'image';

    this.logger.log(`Processing media ${mediaId} (type: ${jobType})`);

    try {
      if (jobType === 'video') {
        await this.processVideo(mediaId, originalKey);
        return;
      }

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

  private async processVideo(mediaId: string, originalKey: string): Promise<void> {
    const originalBuffer = await this.storageService.download(originalKey);
    const tmpDir = '/tmp';
    const tmpInput = path.join(tmpDir, `${mediaId}-input`);
    const tmpOutput = path.join(tmpDir, `${mediaId}-output.mp4`);
    const tmpThumb = path.join(tmpDir, `${mediaId}-thumb.jpg`);

    try {
      fs.writeFileSync(tmpInput, originalBuffer);

      // Probe video metadata (duration, dimensions)
      const metadata = await new Promise<ffmpeg.FfprobeData>((resolve, reject) => {
        ffmpeg.ffprobe(tmpInput, (err: any, data: ffmpeg.FfprobeData) =>
          err ? reject(err) : resolve(data),
        );
      });
      const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
      const duration = metadata.format.duration || 0;
      const width = videoStream?.width || 0;
      const height = videoStream?.height || 0;

      // Transcode to H.264 baseline, AAC audio, max 720p short side
      await new Promise<void>((resolve, reject) => {
        ffmpeg(tmpInput)
          .outputOptions([
            '-c:v libx264',
            '-profile:v baseline',
            '-level 3.1',
            '-preset fast',
            '-crf 23',
            '-c:a aac',
            '-b:a 128k',
            '-movflags +faststart',
            '-vf',
            "scale='min(720,iw)':'min(1280,ih)':force_original_aspect_ratio=decrease",
          ])
          .output(tmpOutput)
          .on('end', () => resolve())
          .on('error', (err: any) => reject(err))
          .run();
      });

      // Generate thumbnail from first frame
      await new Promise<void>((resolve, reject) => {
        ffmpeg(tmpInput)
          .screenshots({
            count: 1,
            timemarks: ['0'],
            filename: `${mediaId}-thumb.jpg`,
            folder: tmpDir,
            size: '720x?',
          })
          .on('end', () => resolve())
          .on('error', (err: any) => reject(err));
      });

      // Upload transcoded video + thumbnail to MinIO
      const transcodedKey = originalKey
        .replace('originals/', 'transcoded/')
        .replace(/\.[^.]+$/, '.mp4');
      const thumbnailKey = originalKey
        .replace('originals/', 'thumbnails/')
        .replace(/\.[^.]+$/, '.jpg');

      await this.storageService.upload(transcodedKey, fs.readFileSync(tmpOutput), 'video/mp4');
      await this.storageService.upload(thumbnailKey, fs.readFileSync(tmpThumb), 'image/jpeg');

      // Update Media record with transcoded keys
      await this.prisma.media.update({
        where: { id: mediaId },
        data: {
          largeKey: transcodedKey,
          thumbnailKey: thumbnailKey,
          status: 'COMPLETED',
        },
      });

      this.logger.log(`Video ${mediaId} transcoded successfully: ${duration}s, ${width}x${height}`);
    } catch (error) {
      this.logger.error(`Failed to transcode video ${mediaId}: ${error}`);

      await this.prisma.media.update({
        where: { id: mediaId },
        data: { status: 'FAILED' },
      });
    } finally {
      // Cleanup temp files
      [tmpInput, tmpOutput, tmpThumb].forEach((f) => {
        try {
          if (fs.existsSync(f)) fs.unlinkSync(f);
        } catch {
          // ignore cleanup errors
        }
      });
    }
  }
}
