import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('Password Reset', () => {
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
    passwordResetToken: {
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
        'frontendUrl': 'http://localhost:3000',
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

  describe('forgotPassword', () => {
    it('should send password reset email for existing user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        name: 'Test User',
      });
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.passwordResetToken.create.mockResolvedValue({ id: 'prt-1' });
      mockEmailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      await service.forgotPassword('test@test.com');

      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@test.com',
        'Test User',
        expect.any(String),
      );
    });

    it('should not throw for non-existent email (security: do not leak)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Should NOT throw -- security: don't reveal whether email exists
      await expect(service.forgotPassword('nonexistent@test.com')).resolves.not.toThrow();
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should update password for valid reset token', async () => {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      mockPrisma.passwordResetToken.findFirst.mockResolvedValue({
        id: 'prt-1',
        tokenHash,
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        usedAt: null,
      });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.passwordResetToken.update.mockResolvedValue({});

      await service.resetPassword(rawToken, 'NewPassword1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({
            passwordHash: expect.any(String),
          }),
        }),
      );
      // Verify it's a proper Argon2 hash
      const updateCall = mockPrisma.user.update.mock.calls[0][0];
      const isArgon2Hash = updateCall.data.passwordHash.startsWith('$argon2');
      expect(isArgon2Hash).toBe(true);
    });

    it('should throw BadRequestException for expired reset token', async () => {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      mockPrisma.passwordResetToken.findFirst.mockResolvedValue({
        id: 'prt-1',
        tokenHash,
        userId: 'user-1',
        expiresAt: new Date(Date.now() - 1000), // expired
        usedAt: null,
      });

      await expect(service.resetPassword(rawToken, 'NewPassword1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for already-used reset token', async () => {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      mockPrisma.passwordResetToken.findFirst.mockResolvedValue({
        id: 'prt-1',
        tokenHash,
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        usedAt: new Date(), // already used
      });

      await expect(service.resetPassword(rawToken, 'NewPassword1'))
        .rejects.toThrow(BadRequestException);
    });
  });
});
