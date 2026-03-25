import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';

describe('JWT Refresh Token', () => {
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

  const mockEmailService = {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
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

  describe('refreshTokens', () => {
    it('should rotate refresh token and return new token pair', async () => {
      const oldRefreshToken = 'old-refresh-token';
      const storedHash = await argon2.hash(oldRefreshToken);

      mockPrisma.refreshToken.findMany.mockResolvedValue([
        {
          id: 'rt-1',
          tokenHash: storedHash,
          userId: 'user-1',
          userAgent: 'Mozilla/5.0',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      ]);
      mockPrisma.refreshToken.delete.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
      });

      mockJwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.refreshTokens('user-1', oldRefreshToken, 'Mozilla/5.0');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      // Old token should be deleted
      expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
      });
      // New token should be created
      expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
    });

    it('should reject expired refresh token', async () => {
      const oldRefreshToken = 'expired-token';
      const storedHash = await argon2.hash(oldRefreshToken);

      mockPrisma.refreshToken.findMany.mockResolvedValue([
        {
          id: 'rt-1',
          tokenHash: storedHash,
          userId: 'user-1',
          expiresAt: new Date(Date.now() - 1000), // expired
        },
      ]);

      await expect(service.refreshTokens('user-1', oldRefreshToken, 'Mozilla/5.0')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should delete all user tokens on stolen token detection (invalid token)', async () => {
      mockPrisma.refreshToken.findMany.mockResolvedValue([
        {
          id: 'rt-1',
          tokenHash: await argon2.hash('legitimate-token'),
          userId: 'user-1',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      ]);
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await expect(
        service.refreshTokens('user-1', 'stolen-or-invalid-token', 'Mozilla/5.0'),
      ).rejects.toThrow(UnauthorizedException);

      // All tokens for this user should be deleted (security measure)
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });
});
