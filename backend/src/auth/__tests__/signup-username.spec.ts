import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';

// Test the shared validators directly
import { usernameSchema, bioSchema, USERNAME_RULES, RESERVED_USERNAMES } from '@figly/shared';

describe('Username and Bio validators (shared package)', () => {
  describe('USERNAME_RULES', () => {
    it('should have minLength of 3', () => {
      expect(USERNAME_RULES.minLength).toBe(3);
    });

    it('should have maxLength of 30', () => {
      expect(USERNAME_RULES.maxLength).toBe(30);
    });

    it('should have pattern for lowercase, numbers, underscores, periods', () => {
      expect(USERNAME_RULES.pattern).toEqual(/^[a-z0-9_.]+$/);
    });

    it('should have cooldownDays of 14', () => {
      expect(USERNAME_RULES.cooldownDays).toBe(14);
    });
  });

  describe('usernameSchema', () => {
    it('should accept valid usernames (lowercase, numbers, underscores, periods)', () => {
      const validUsernames = [
        'john_doe',
        'user123',
        'test.user',
        'a_b.c',
        'abc',
        'user_name_with_30_chars_abcdef',
      ];
      for (const username of validUsernames) {
        const result = usernameSchema.safeParse(username);
        expect(result.success).toBe(true);
      }
    });

    it('should reject usernames shorter than 3 characters', () => {
      const result = usernameSchema.safeParse('ab');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('3');
      }
    });

    it('should reject usernames longer than 30 characters', () => {
      const result = usernameSchema.safeParse('a'.repeat(31));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('30');
      }
    });

    it('should reject uppercase characters', () => {
      const result = usernameSchema.safeParse('JohnDoe');
      expect(result.success).toBe(false);
    });

    it('should reject spaces', () => {
      const result = usernameSchema.safeParse('john doe');
      expect(result.success).toBe(false);
    });

    it('should reject special characters (hyphens, @, etc.)', () => {
      const invalidNames = ['john-doe', 'user@name', 'name!', 'test#1'];
      for (const name of invalidNames) {
        const result = usernameSchema.safeParse(name);
        expect(result.success).toBe(false);
      }
    });

    it('should have Vietnamese error messages', () => {
      const tooShort = usernameSchema.safeParse('ab');
      expect(tooShort.success).toBe(false);
      if (!tooShort.success) {
        expect(tooShort.error.issues[0].message).toMatch(/Ten nguoi dung/);
      }
    });
  });

  describe('RESERVED_USERNAMES', () => {
    it('should include common reserved names', () => {
      const expected = [
        'api',
        'auth',
        'admin',
        'login',
        'signup',
        'settings',
        'explore',
        'search',
        'help',
        'about',
        'terms',
        'privacy',
        'notifications',
        'messages',
        'feed',
        'discover',
      ];
      for (const name of expected) {
        expect(RESERVED_USERNAMES).toContain(name);
      }
    });
  });

  describe('bioSchema', () => {
    it('should accept valid bio text up to 150 chars', () => {
      const result = bioSchema.safeParse('This is a valid bio');
      expect(result.success).toBe(true);
    });

    it('should accept empty string', () => {
      const result = bioSchema.safeParse('');
      expect(result.success).toBe(true);
    });

    it('should reject bio longer than 150 characters', () => {
      const result = bioSchema.safeParse('a'.repeat(151));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/150/);
      }
    });

    it('should have Vietnamese error message for too long bio', () => {
      const result = bioSchema.safeParse('a'.repeat(151));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/Tieu su/);
      }
    });
  });
});

describe('AuthService - signup with simplified dto (email+password only)', () => {
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
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
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

  it('should create user with null name and null username when signing up with email+password only', async () => {
    const signupDto = {
      email: 'test@test.com',
      password: 'Test1234',
    };

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: signupDto.email,
      name: null,
      username: null,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.signup(signupDto);

    expect(result).toBeDefined();
    expect(result.name).toBeNull();
    expect(result.username).toBeNull();
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: null,
          username: null,
        }),
      }),
    );
  });

  it('should include username in getMe response', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
      name: 'Test User',
      username: 'testuser',
      emailVerified: true,
    });

    const result = await service.getMe('user-1');
    expect(result.user.username).toBe('testuser');
  });
});
