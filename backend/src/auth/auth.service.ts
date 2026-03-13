import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { TOKEN_EXPIRY } from '@figly/shared';
import type { TokenPair } from '@figly/shared';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ---------------------
  // Signup & Login
  // ---------------------

  async signup(dto: { email: string; password: string; name: string }) {
    // Check email uniqueness
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email da duoc su dung');
    }

    // Hash password with Argon2
    const passwordHash = await argon2.hash(dto.password);

    // Create user with emailVerified=false
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async validateUser(email: string, password: string) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Email khong ton tai');
    }

    // Verify password
    if (!user.passwordHash) {
      throw new UnauthorizedException('Sai mat khau');
    }

    const passwordValid = await argon2.verify(user.passwordHash, password);
    if (!passwordValid) {
      throw new UnauthorizedException('Sai mat khau');
    }

    // Check email verification
    if (!user.emailVerified) {
      throw new ForbiddenException('Email chua duoc xac minh');
    }

    return user;
  }

  async login(user: { id: string; email: string }, userAgent: string): Promise<TokenPair> {
    // Generate access token (15min)
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email },
      {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: TOKEN_EXPIRY.access,
      },
    );

    // Generate refresh token (30d)
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: TOKEN_EXPIRY.refresh,
      },
    );

    // Hash refresh token and store in DB
    const tokenHash = await argon2.hash(refreshToken);
    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        userAgent,
        expiresAt: new Date(Date.now() + TOKEN_EXPIRY.refreshSeconds * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  async refreshTokens(userId: string, refreshToken: string, userAgent: string): Promise<TokenPair> {
    // Find all refresh tokens for this user
    const storedTokens = await this.prisma.refreshToken.findMany({
      where: { userId },
    });

    // Find the matching token by verifying against stored hashes
    let matchedToken: (typeof storedTokens)[0] | null = null;

    for (const stored of storedTokens) {
      try {
        const isMatch = await argon2.verify(stored.tokenHash, refreshToken);
        if (isMatch) {
          matchedToken = stored;
          break;
        }
      } catch {
        // Skip invalid hashes
        continue;
      }
    }

    if (!matchedToken) {
      // Possible stolen token -- delete ALL user's refresh tokens (security measure)
      await this.prisma.refreshToken.deleteMany({
        where: { userId },
      });
      throw new UnauthorizedException('Token khong hop le');
    }

    // Check if token is expired
    if (matchedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({
        where: { id: matchedToken.id },
      });
      throw new UnauthorizedException('Token da het han');
    }

    // Delete old token (rotation)
    await this.prisma.refreshToken.delete({
      where: { id: matchedToken.id },
    });

    // Get user for new token generation
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new UnauthorizedException('User khong ton tai');
    }

    // Generate new token pair
    return this.login(user, userAgent);
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    // Find all refresh tokens for this user
    const storedTokens = await this.prisma.refreshToken.findMany({
      where: { userId },
    });

    // Find and delete the matching token
    for (const stored of storedTokens) {
      try {
        const isMatch = await argon2.verify(stored.tokenHash, refreshToken);
        if (isMatch) {
          await this.prisma.refreshToken.delete({
            where: { id: stored.id },
          });
          return;
        }
      } catch {
        continue;
      }
    }
  }

  // ---------------------
  // Email Verification
  // ---------------------

  async sendVerificationEmail(userId: string, email: string, name: string): Promise<void> {
    // Generate 64-char hex token
    const rawToken = crypto.randomBytes(32).toString('hex');
    // SHA-256 hash for storage (fast hash, single-use token)
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    await this.prisma.verificationToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt: new Date(Date.now() + TOKEN_EXPIRY.emailVerificationSeconds * 1000),
      },
    });

    await this.emailService.sendVerificationEmail(email, name, rawToken);
  }

  async verifyEmail(rawToken: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const verificationToken = await this.prisma.verificationToken.findFirst({
      where: { tokenHash },
    });

    if (!verificationToken) {
      throw new BadRequestException('Token xac minh khong hop le');
    }

    if (verificationToken.usedAt) {
      throw new BadRequestException('Token xac minh da duoc su dung');
    }

    if (verificationToken.expiresAt < new Date()) {
      throw new BadRequestException('Token xac minh da het han');
    }

    // Update user emailVerified
    await this.prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    // Mark token as used
    await this.prisma.verificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() },
    });
  }

  async resendVerification(userId: string, email: string, name: string): Promise<void> {
    // Delete old verification tokens
    await this.prisma.verificationToken.deleteMany({
      where: { userId },
    });

    // Send new verification email
    await this.sendVerificationEmail(userId, email, name);
  }

  // ---------------------
  // Password Reset
  // ---------------------

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    // Security: always return success (don't leak whether email exists)
    if (!user) {
      return;
    }

    // Delete old reset tokens for this user
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate 64-char hex token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    await this.prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + TOKEN_EXPIRY.passwordResetSeconds * 1000),
      },
    });

    await this.emailService.sendPasswordResetEmail(user.email, user.name, rawToken);
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash },
    });

    if (!resetToken) {
      throw new BadRequestException('Token dat lai mat khau khong hop le');
    }

    if (resetToken.usedAt) {
      throw new BadRequestException('Token dat lai mat khau da duoc su dung');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Token dat lai mat khau da het han');
    }

    // Hash new password with Argon2
    const passwordHash = await argon2.hash(newPassword);

    // Update user password
    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    // Mark token as used
    await this.prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });
  }

  // ---------------------
  // OAuth Handlers
  // ---------------------

  async handleGoogleLogin(profile: { googleId: string; email: string; name: string }) {
    // Find by googleId
    const existingByGoogleId = await this.prisma.user.findUnique({
      where: { googleId: profile.googleId },
    });

    if (existingByGoogleId) {
      return existingByGoogleId;
    }

    // Find by email (link accounts)
    const existingByEmail = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (existingByEmail) {
      return this.prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          googleId: profile.googleId,
          emailVerified: true,
          emailVerifiedAt: existingByEmail.emailVerifiedAt || new Date(),
        },
      });
    }

    // Create new user (OAuth users are auto-verified)
    return this.prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        googleId: profile.googleId,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
  }

  async handleAppleLogin(profile: { appleId: string; email: string; name?: string }) {
    // Find by appleId
    const existingByAppleId = await this.prisma.user.findUnique({
      where: { appleId: profile.appleId },
    });

    if (existingByAppleId) {
      return existingByAppleId;
    }

    // Find by email (link accounts)
    const existingByEmail = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (existingByEmail) {
      return this.prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          appleId: profile.appleId,
          emailVerified: true,
          emailVerifiedAt: existingByEmail.emailVerifiedAt || new Date(),
        },
      });
    }

    // Create new user -- Apple may not provide name on subsequent logins
    const userName = profile.name || profile.email.split('@')[0];
    return this.prisma.user.create({
      data: {
        email: profile.email,
        name: userName,
        appleId: profile.appleId,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
  }

  // ---------------------
  // Cookie Management
  // ---------------------

  setCookies(res: any, tokens: TokenPair): void {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: TOKEN_EXPIRY.accessSeconds * 1000,
      path: '/',
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: TOKEN_EXPIRY.refreshSeconds * 1000,
      path: '/api/auth/refresh',
    });
  }

  clearCookies(res: any): void {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
  }
}
