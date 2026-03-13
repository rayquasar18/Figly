import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

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
        'frontendUrl': 'http://localhost:3000',
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
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe('signup', () => {
    const signupDto = { email: 'test@test.com', password: 'Test1234', name: 'Test User', username: 'testuser' };

    it('should create user with hashed password and emailVerified=false', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: signupDto.email,
        name: signupDto.name,
        username: signupDto.username,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.signup(signupDto);

      expect(result).toBeDefined();
      expect(result.email).toBe(signupDto.email);
      expect(result.emailVerified).toBe(false);
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: signupDto.email,
            name: signupDto.name,
            emailVerified: false,
          }),
        }),
      );

      // Verify password was hashed (not stored plaintext)
      const createCall = mockPrisma.user.create.mock.calls[0][0];
      expect(createCall.data.passwordHash).not.toBe(signupDto.password);
      expect(createCall.data.passwordHash).toBeTruthy();
    });

    it('should throw ConflictException for duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: signupDto.email,
      });

      await expect(service.signup(signupDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('validateUser', () => {
    it('should return user for valid credentials with verified email', async () => {
      const hashedPassword = await argon2.hash('Test1234');
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: hashedPassword,
        name: 'Test User',
        emailVerified: true,
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@test.com', 'Test1234');

      expect(result).toBeDefined();
      expect(result.id).toBe('user-1');
    });

    it('should throw UnauthorizedException with "Email khong ton tai" for non-existent email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.validateUser('nonexistent@test.com', 'Test1234'))
        .rejects
        .toThrow(new UnauthorizedException('Email khong ton tai'));
    });

    it('should throw UnauthorizedException with "Sai mat khau" for wrong password', async () => {
      const hashedPassword = await argon2.hash('CorrectPassword1');
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: hashedPassword,
        emailVerified: true,
      });

      await expect(service.validateUser('test@test.com', 'WrongPassword1'))
        .rejects
        .toThrow(new UnauthorizedException('Sai mat khau'));
    });

    it('should throw ForbiddenException with "Email chua duoc xac minh" for unverified email', async () => {
      const hashedPassword = await argon2.hash('Test1234');
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: hashedPassword,
        emailVerified: false,
      });

      await expect(service.validateUser('test@test.com', 'Test1234'))
        .rejects
        .toThrow(new ForbiddenException('Email chua duoc xac minh'));
    });
  });

  describe('login', () => {
    it('should generate access and refresh tokens', async () => {
      const mockUser = { id: 'user-1', email: 'test@test.com' };
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token-123')
        .mockResolvedValueOnce('refresh-token-456');
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login(mockUser as any, 'Mozilla/5.0');

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('access-token-123');
      expect(result.refreshToken).toBe('refresh-token-456');
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
    });

    it('should store hashed refresh token in database', async () => {
      const mockUser = { id: 'user-1', email: 'test@test.com' };
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      mockPrisma.refreshToken.create.mockResolvedValue({});

      await service.login(mockUser as any, 'Mozilla/5.0');

      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            userAgent: 'Mozilla/5.0',
          }),
        }),
      );
      // tokenHash should be stored (not plaintext)
      const createCall = mockPrisma.refreshToken.create.mock.calls[0][0];
      expect(createCall.data.tokenHash).toBeTruthy();
    });
  });

  describe('logout', () => {
    it('should delete matching refresh token from database', async () => {
      const storedHash = await argon2.hash('refresh-token-to-delete');
      mockPrisma.refreshToken.findMany.mockResolvedValue([
        { id: 'rt-1', tokenHash: storedHash, userId: 'user-1' },
      ]);
      mockPrisma.refreshToken.delete.mockResolvedValue({});

      await service.logout('user-1', 'refresh-token-to-delete');

      expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rt-1' },
        }),
      );
    });
  });
});
