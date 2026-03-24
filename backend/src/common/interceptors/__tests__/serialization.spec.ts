import {
  authUserResponseSchema,
  userResponseSchema,
  signupResponseSchema,
  loginResponseSchema,
  meResponseSchema,
} from '../../dto/user-response.dto';

describe('Response Serialization Schemas', () => {
  // Full user object as Prisma might return it (with sensitive fields)
  const fullUser = {
    id: 'cuid-123',
    email: 'test@example.com',
    username: 'testuser',
    name: 'Test User',
    emailVerified: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$hash',
    resetToken: 'some-reset-token',
    verifyToken: 'some-verify-token',
    googleId: 'google-123',
    appleId: 'apple-456',
    avatarUrl: 'https://cdn.example.com/avatar.jpg',
    bio: 'Hello world',
  };

  describe('UserResponseDto schema', () => {
    it('should strip passwordHash from input object', () => {
      const result = userResponseSchema.parse(fullUser);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should preserve id, email, username, name, emailVerified fields', () => {
      const result = userResponseSchema.parse(fullUser);
      expect(result).toEqual({
        id: 'cuid-123',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        emailVerified: true,
      });
    });

    it('should strip extra fields like resetToken, verifyToken, googleId, appleId', () => {
      const result = userResponseSchema.parse(fullUser);
      expect(result).not.toHaveProperty('resetToken');
      expect(result).not.toHaveProperty('verifyToken');
      expect(result).not.toHaveProperty('googleId');
      expect(result).not.toHaveProperty('appleId');
      expect(result).not.toHaveProperty('avatarUrl');
      expect(result).not.toHaveProperty('bio');
    });
  });

  describe('AuthUserResponseDto schema', () => {
    it('should include createdAt and updatedAt fields', () => {
      const result = authUserResponseSchema.parse(fullUser);
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('should strip passwordHash from auth user response', () => {
      const result = authUserResponseSchema.parse(fullUser);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should preserve all expected auth user fields', () => {
      const result = authUserResponseSchema.parse(fullUser);
      expect(result).toEqual({
        id: 'cuid-123',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        emailVerified: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      });
    });
  });

  describe('SignupResponseDto schema', () => {
    it('should wrap user in signup response with message', () => {
      const signupData = {
        message: 'Dang ky thanh cong',
        user: fullUser,
      };
      const result = signupResponseSchema.parse(signupData);
      expect(result.message).toBe('Dang ky thanh cong');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user.id).toBe('cuid-123');
      expect(result.user.createdAt).toEqual(new Date('2026-01-01'));
    });
  });

  describe('LoginResponseDto schema', () => {
    it('should wrap user in login response without passwordHash', () => {
      const loginData = {
        user: fullUser,
      };
      const result = loginResponseSchema.parse(loginData);
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user).not.toHaveProperty('createdAt');
      expect(result.user.id).toBe('cuid-123');
    });
  });

  describe('MeResponseDto schema', () => {
    it('should wrap user in me response without passwordHash', () => {
      const meData = {
        user: fullUser,
      };
      const result = meResponseSchema.parse(meData);
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user.id).toBe('cuid-123');
      expect(result.user.emailVerified).toBe(true);
    });
  });
});
