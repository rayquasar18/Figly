import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('Apple Sign-In', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
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

  describe('handleAppleLogin', () => {
    const appleProfile = {
      appleId: 'apple-123',
      email: 'test@icloud.com',
      name: 'Apple User',
    };

    it('should return existing user found by appleId', async () => {
      const existingUser = {
        id: 'user-1',
        email: 'test@icloud.com',
        name: 'Apple User',
        appleId: 'apple-123',
        emailVerified: true,
      };
      mockPrisma.user.findUnique.mockResolvedValueOnce(existingUser);

      const result = await service.handleAppleLogin(appleProfile);

      expect(result).toBeDefined();
      expect(result.id).toBe('user-1');
    });

    it('should link to existing account found by email and set emailVerified=true', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null); // not by appleId
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-2',
        email: 'test@icloud.com',
        name: 'Existing User',
        appleId: null,
        emailVerified: false,
      }); // found by email

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-2',
        email: 'test@icloud.com',
        name: 'Existing User',
        appleId: 'apple-123',
        emailVerified: true,
      });

      const result = await service.handleAppleLogin(appleProfile);

      expect(result).toBeDefined();
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-2' },
          data: expect.objectContaining({
            appleId: 'apple-123',
            emailVerified: true,
          }),
        }),
      );
    });

    it('should create new user if no existing account', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null); // not by appleId
      mockPrisma.user.findUnique.mockResolvedValueOnce(null); // not by email
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-3',
        email: 'test@icloud.com',
        name: 'Apple User',
        appleId: 'apple-123',
        emailVerified: true,
      });

      const result = await service.handleAppleLogin(appleProfile);

      expect(result).toBeDefined();
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'test@icloud.com',
            name: 'Apple User',
            appleId: 'apple-123',
            emailVerified: true,
          }),
        }),
      );
    });

    it('should handle Apple login without name (subsequent logins)', async () => {
      const profileWithoutName = {
        appleId: 'apple-123',
        email: 'test@icloud.com',
        name: undefined,
      };

      mockPrisma.user.findUnique.mockResolvedValueOnce(null); // not by appleId
      mockPrisma.user.findUnique.mockResolvedValueOnce(null); // not by email
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-4',
        email: 'test@icloud.com',
        name: 'Apple User',
        appleId: 'apple-123',
        emailVerified: true,
      });

      const result = await service.handleAppleLogin(profileWithoutName);

      expect(result).toBeDefined();
      // Name should default to email prefix or 'Apple User' when not provided
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: expect.any(String),
          }),
        }),
      );
    });
  });
});
