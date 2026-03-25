import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaService } from '../media.service';
import { MediaProcessor } from '../media.processor';
import { StorageService } from '../storage.service';
import { PrismaService } from '../../prisma/prisma.service';
import { FILE_LIMITS, THUMBNAIL_SIZES } from '@figly/shared';

// Mock Sharp
const mockSharpInstance = {
  resize: jest.fn().mockReturnThis(),
  webp: jest.fn().mockReturnThis(),
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-image')),
};
jest.mock('sharp', () => jest.fn(() => mockSharpInstance));

describe('MediaService', () => {
  let service: MediaService;
  let prisma: PrismaService;
  let storageService: StorageService;
  let mockQueue: any;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: PrismaService,
          useValue: {
            media: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: StorageService,
          useValue: {
            upload: jest.fn().mockResolvedValue(undefined),
            download: jest.fn().mockResolvedValue(Buffer.from('original-image')),
            getPresignedUrl: jest.fn().mockResolvedValue('https://minio.local/presigned-url'),
          },
        },
        {
          provide: 'BullQueue_media-processing',
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
    prisma = module.get<PrismaService>(PrismaService);
    storageService = module.get<StorageService>(StorageService);
  });

  describe('upload', () => {
    const mockFile = {
      originalname: 'test.jpg',
      mimetype: 'image/jpeg',
      size: 1024 * 1024, // 1MB
      buffer: Buffer.from('test-image-data'),
    } as Express.Multer.File;

    const userId = 'user-123';

    it('should upload a valid image file', async () => {
      const mockMedia = {
        id: 'media-1',
        userId,
        originalKey: 'originals/user-123/uuid-test.jpg',
        status: 'PROCESSING',
      };

      (prisma.media.create as jest.Mock).mockResolvedValue(mockMedia);

      const result = await service.upload(mockFile, userId);

      expect(storageService.upload).toHaveBeenCalled();
      expect(prisma.media.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            status: 'PROCESSING',
            mimeType: 'image/jpeg',
          }),
        }),
      );
      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-media',
        expect.objectContaining({
          mediaId: 'media-1',
          userId,
        }),
      );
      expect(result).toEqual(mockMedia);
    });

    it('should reject non-image files with BadRequestException', async () => {
      const nonImageFile = {
        ...mockFile,
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      await expect(service.upload(nonImageFile, userId)).rejects.toThrow(BadRequestException);
    });

    it('should reject files exceeding size limit with PayloadTooLargeException', async () => {
      const oversizedFile = {
        ...mockFile,
        size: FILE_LIMITS.image + 1, // Just over 10MB
      } as Express.Multer.File;

      await expect(service.upload(oversizedFile, userId)).rejects.toThrow(PayloadTooLargeException);
    });
  });

  describe('getMedia', () => {
    it('should return media with presigned URLs', async () => {
      const mockMedia = {
        id: 'media-1',
        userId: 'user-123',
        originalKey: 'originals/user-123/uuid-test.jpg',
        thumbnailKey: 'thumbnail/user-123/uuid-test.jpg',
        mediumKey: 'medium/user-123/uuid-test.jpg',
        largeKey: 'large/user-123/uuid-test.jpg',
        status: 'COMPLETED',
        mimeType: 'image/jpeg',
        size: 1024,
      };

      (prisma.media.findUnique as jest.Mock).mockResolvedValue(mockMedia);

      const result = await service.getMedia('media-1', 'user-123');

      expect(result.media).toEqual(mockMedia);
      expect(result.urls).toBeDefined();
      expect(result.urls.original).toBeDefined();
      expect(result.urls.thumbnail).toBeDefined();
      expect(result.urls.medium).toBeDefined();
      expect(result.urls.large).toBeDefined();
      expect(storageService.getPresignedUrl).toHaveBeenCalledTimes(4);
    });

    it('should return null URLs for missing variant keys', async () => {
      const mockMedia = {
        id: 'media-1',
        userId: 'user-123',
        originalKey: 'originals/user-123/uuid-test.jpg',
        thumbnailKey: null,
        mediumKey: null,
        largeKey: null,
        status: 'PROCESSING',
        mimeType: 'image/jpeg',
        size: 1024,
      };

      (prisma.media.findUnique as jest.Mock).mockResolvedValue(mockMedia);

      const result = await service.getMedia('media-1', 'user-123');

      expect(result.urls.thumbnail).toBeNull();
      expect(result.urls.medium).toBeNull();
      expect(result.urls.large).toBeNull();
      // Only original URL should have been fetched
      expect(storageService.getPresignedUrl).toHaveBeenCalledTimes(1);
    });
  });

  describe('getMediaStatus', () => {
    it('should return status only', async () => {
      (prisma.media.findUnique as jest.Mock).mockResolvedValue({
        id: 'media-1',
        status: 'COMPLETED',
      });

      const result = await service.getMediaStatus('media-1');
      expect(result).toEqual({ status: 'COMPLETED' });
    });
  });
});

describe('MediaProcessor', () => {
  let processor: MediaProcessor;
  let prisma: PrismaService;
  let storageService: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaProcessor,
        {
          provide: PrismaService,
          useValue: {
            media: {
              update: jest.fn().mockResolvedValue({}),
            },
          },
        },
        {
          provide: StorageService,
          useValue: {
            upload: jest.fn().mockResolvedValue(undefined),
            download: jest.fn().mockResolvedValue(Buffer.from('original-image')),
          },
        },
      ],
    }).compile();

    processor = module.get<MediaProcessor>(MediaProcessor);
    prisma = module.get<PrismaService>(PrismaService);
    storageService = module.get<StorageService>(StorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('process', () => {
    it('should generate 3 thumbnail sizes and update media record', async () => {
      const job = {
        data: {
          mediaId: 'media-1',
          originalKey: 'originals/user-123/uuid-test.jpg',
          userId: 'user-123',
        },
      } as any;

      await processor.process(job);

      // Should download original
      expect(storageService.download).toHaveBeenCalledWith('originals/user-123/uuid-test.jpg');

      // Should upload 3 variants
      expect(storageService.upload).toHaveBeenCalledTimes(3);

      // Should update media record with variant keys and COMPLETED status
      expect(prisma.media.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'media-1' },
          data: expect.objectContaining({
            status: 'COMPLETED',
            thumbnailKey: expect.stringContaining('thumbnail/'),
            mediumKey: expect.stringContaining('medium/'),
            largeKey: expect.stringContaining('large/'),
          }),
        }),
      );
    });

    it('should set status to FAILED on processing error', async () => {
      (storageService.download as jest.Mock).mockRejectedValue(new Error('Download failed'));

      const job = {
        data: {
          mediaId: 'media-1',
          originalKey: 'originals/user-123/uuid-test.jpg',
          userId: 'user-123',
        },
      } as any;

      await processor.process(job);

      expect(prisma.media.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'media-1' },
          data: expect.objectContaining({
            status: 'FAILED',
          }),
        }),
      );
    });
  });
});

describe('StorageService', () => {
  let storageService: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, any> = {
                'minio.endpoint': 'localhost',
                'minio.port': 9000,
                'minio.accessKey': 'minioadmin',
                'minio.secretKey': 'minioadmin',
                'minio.bucket': 'figly-media',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    storageService = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(storageService).toBeDefined();
  });

  it('should have upload method', () => {
    expect(typeof storageService.upload).toBe('function');
  });

  it('should have download method', () => {
    expect(typeof storageService.download).toBe('function');
  });

  it('should have getPresignedUrl method', () => {
    expect(typeof storageService.getPresignedUrl).toBe('function');
  });
});
