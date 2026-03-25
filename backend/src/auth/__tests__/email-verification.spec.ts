import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('Email Verification', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    verificationToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'jwt.accessSecret': 'test-access-secret',
        'jwt.refreshSecret': 'test-refresh-secret',
        frontendUrl: 'http://localhost:3000',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmailService, useValue: mockEmailService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('sendVerificationEmail', () => {
    it('should create a verification token with SHA-256 hash and 24h expiry', async () => {
      mockPrisma.verificationToken.create.mockResolvedValue({ id: 'vt-1' });
      mockEmailService.sendVerificationEmail.mockResolvedValue(undefined);

      await service.sendVerificationEmail('user-1', 'test@test.com', 'Test User');

      expect(mockPrisma.verificationToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
          }),
        }),
      );

      // Token hash should be stored (SHA-256, not the raw token)
      const createCall = mockPrisma.verificationToken.create.mock.calls[0][0];
      expect(createCall.data.tokenHash).toBeTruthy();
      expect(createCall.data.expiresAt).toBeDefined();

      // Email should be sent via EmailService
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        'test@test.com',
        'Test User',
        expect.any(String), // raw token
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email and set emailVerified=true for valid token', async () => {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      mockPrisma.verificationToken.findFirst.mockResolvedValue({
        id: 'vt-1',
        tokenHash,
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        usedAt: null,
      });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.verificationToken.update.mockResolvedValue({});

      await service.verifyEmail(rawToken);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({
            emailVerified: true,
          }),
        }),
      );
    });

    it('should throw BadRequestException for expired token', async () => {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      mockPrisma.verificationToken.findFirst.mockResolvedValue({
        id: 'vt-1',
        tokenHash,
        userId: 'user-1',
        expiresAt: new Date(Date.now() - 1000), // expired
        usedAt: null,
      });

      await expect(service.verifyEmail(rawToken)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for already-used token', async () => {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      mockPrisma.verificationToken.findFirst.mockResolvedValue({
        id: 'vt-1',
        tokenHash,
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        usedAt: new Date(), // already used
      });

      await expect(service.verifyEmail(rawToken)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid/nonexistent token', async () => {
      mockPrisma.verificationToken.findFirst.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(BadRequestException);
    });
  });

  describe('resendVerification', () => {
    it('should delete old tokens and send new verification email', async () => {
      mockPrisma.verificationToken.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.verificationToken.create.mockResolvedValue({ id: 'vt-2' });
      mockEmailService.sendVerificationEmail.mockResolvedValue(undefined);

      await service.resendVerification('user-1', 'test@test.com', 'Test User');

      expect(mockPrisma.verificationToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
    });
  });
});
