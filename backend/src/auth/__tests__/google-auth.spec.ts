import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('Google OAuth', () => {
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

  describe('handleGoogleLogin', () => {
    const googleProfile = {
      googleId: 'google-123',
      email: 'test@gmail.com',
      name: 'Test User',
    };

    it('should return existing user found by googleId', async () => {
      const existingUser = {
        id: 'user-1',
        email: 'test@gmail.com',
        name: 'Test User',
        googleId: 'google-123',
        emailVerified: true,
      };
      mockPrisma.user.findUnique.mockResolvedValueOnce(existingUser); // findUnique by googleId

      const result = await service.handleGoogleLogin(googleProfile);

      expect(result).toBeDefined();
      expect(result.id).toBe('user-1');
    });

    it('should link to existing account found by email and set emailVerified=true', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null); // not found by googleId
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-2',
        email: 'test@gmail.com',
        name: 'Existing User',
        googleId: null,
        emailVerified: false,
      }); // found by email

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-2',
        email: 'test@gmail.com',
        name: 'Existing User',
        googleId: 'google-123',
        emailVerified: true,
      });

      const result = await service.handleGoogleLogin(googleProfile);

      expect(result).toBeDefined();
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-2' },
          data: expect.objectContaining({
            googleId: 'google-123',
            emailVerified: true,
          }),
        }),
      );
    });

    it('should create new user if no existing account', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null); // not by googleId
      mockPrisma.user.findUnique.mockResolvedValueOnce(null); // not by email
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-3',
        email: 'test@gmail.com',
        name: 'Test User',
        googleId: 'google-123',
        emailVerified: true,
      });

      const result = await service.handleGoogleLogin(googleProfile);

      expect(result).toBeDefined();
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'test@gmail.com',
            name: 'Test User',
            googleId: 'google-123',
            emailVerified: true,
          }),
        }),
      );
    });
  });
});
