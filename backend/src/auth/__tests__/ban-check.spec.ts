import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { JwtStrategy } from '../strategies/jwt.strategy';
import * as argon2 from 'argon2';

// Mock argon2
jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  verify: jest.fn().mockResolvedValue(true),
}));

describe('AuthService - Ban Check', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    verificationToken: {
      findFirst: jest.fn(),
    },
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mock-token'),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
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

  describe('validateUser', () => {
    it('should reject banned user with ForbiddenException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: 'hashed',
        emailVerified: true,
        isBanned: true,
      });

      await expect(
        service.validateUser('test@test.com', 'password'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('handleGoogleLogin', () => {
    it('should reject banned user with ForbiddenException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        googleId: 'google-123',
        email: 'test@test.com',
        isBanned: true,
      });

      await expect(
        service.handleGoogleLogin({
          googleId: 'google-123',
          email: 'test@test.com',
          name: 'Test User',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('handleAppleLogin', () => {
    it('should reject banned user with ForbiddenException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        appleId: 'apple-123',
        email: 'test@test.com',
        isBanned: true,
      });

      await expect(
        service.handleAppleLogin({
          appleId: 'apple-123',
          email: 'test@test.com',
          name: 'Test User',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('refreshTokens', () => {
    it('should reject banned user and delete all refresh tokens', async () => {
      mockPrisma.refreshToken.findMany.mockResolvedValue([
        {
          id: 'token-1',
          tokenHash: 'hash',
          userId: 'user-1',
          expiresAt: new Date(Date.now() + 100000),
        },
      ]);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      mockPrisma.refreshToken.delete.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        isBanned: true,
      });
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await expect(
        service.refreshTokens('user-1', 'valid-token', 'Mozilla'),
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });
});

describe('JwtStrategy - Ban Check', () => {
  it('should reject banned user with UnauthorizedException', async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          isBanned: true,
        }),
      },
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-secret'),
    };

    // We test the validate method directly since JwtStrategy extends PassportStrategy
    const strategy = new JwtStrategy(
      mockConfigService as any,
      mockPrisma as any,
    );

    await expect(
      strategy.validate({ sub: 'user-1', email: 'test@test.com' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
