import { OptionalJwtAuthGuard } from '../guards/optional-jwt-auth.guard';

describe('OptionalJwtAuthGuard', () => {
  let guard: OptionalJwtAuthGuard;

  beforeEach(() => {
    guard = new OptionalJwtAuthGuard();
  });

  describe('handleRequest', () => {
    it('should return user object when valid user is provided', () => {
      const user = { userId: 'user-1', email: 'test@example.com' };

      const result = guard.handleRequest(null, user);

      expect(result).toEqual(user);
    });

    it('should return null when user is falsy (no token)', () => {
      const result = guard.handleRequest(null, null);

      expect(result).toBeNull();
    });

    it('should return null when user is undefined', () => {
      const result = guard.handleRequest(null, undefined);

      expect(result).toBeNull();
    });

    it('should return null when error is set and no user', () => {
      const err = new Error('jwt expired');

      const result = guard.handleRequest(err, null);

      expect(result).toBeNull();
    });

    it('should return user even when error is set but user is valid', () => {
      const err = new Error('some warning');
      const user = { userId: 'user-1' };

      const result = guard.handleRequest(err, user);

      expect(result).toEqual(user);
    });

    it('should NOT throw UnauthorizedException for unauthenticated requests', () => {
      expect(() => guard.handleRequest(new Error('Unauthorized'), null)).not.toThrow();
      expect(() => guard.handleRequest(null, false)).not.toThrow();
      expect(() => guard.handleRequest(null, null)).not.toThrow();
    });
  });
});
