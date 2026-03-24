import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

@Injectable()
export class MinioHealthIndicator extends HealthIndicator {
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    super();
    const endpoint =
      this.configService.get<string>('minio.endpoint') || 'localhost';
    const port = this.configService.get<number>('minio.port') || 9000;
    const accessKey =
      this.configService.get<string>('minio.accessKey') || 'minioadmin';
    const secretKey =
      this.configService.get<string>('minio.secretKey') || 'minioadmin';
    this.bucket =
      this.configService.get<string>('minio.bucket') || 'figly-media';

    this.s3Client = new S3Client({
      endpoint: `http://${endpoint}:${port}`,
      region: 'us-east-1',
      forcePathStyle: true,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    });
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.bucket }),
      );
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        `${key} health check failed`,
        this.getStatus(key, false, { message: (error as Error).message }),
      );
    }
  }
}
