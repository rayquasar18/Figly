import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  SignupDto,
  LoginDto,
  ResetPasswordRequestDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { EmailVerifiedGuard } from './guards/email-verified.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { AppleAuthGuard } from './guards/apple-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ---------------------
  // Email/Password Auth
  // ---------------------

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    const user = await this.authService.signup(signupDto);
    // Send verification email
    await this.authService.sendVerificationEmail(user.id, user.email, user.name ?? '');
    return {
      message: 'Dang ky thanh cong. Vui long kiem tra email de xac minh.',
      user,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Throttle({ login: { ttl: 60000, limit: 5 } })
  async login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as any;
    const userAgent = req.headers['user-agent'] || 'unknown';
    const tokens = await this.authService.login({ id: user.id, email: user.email }, userAgent);
    this.authService.setCookies(res, tokens);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { userId, refreshToken } = req.user as any;
    const userAgent = req.headers['user-agent'] || 'unknown';
    const tokens = await this.authService.refreshTokens(userId, refreshToken, userAgent);
    this.authService.setCookies(res, tokens);
    return { message: 'Token da duoc lam moi' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { userId } = req.user as any;
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      await this.authService.logout(userId, refreshToken);
    }
    this.authService.clearCookies(res);
    return { message: 'Dang xuat thanh cong' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request) {
    const { userId } = req.user as any;
    return this.authService.getMe(userId);
  }

  // ---------------------
  // Email Verification
  // ---------------------

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    if (!token) {
      return { message: 'Token xac minh khong duoc cung cap' };
    }
    await this.authService.verifyEmail(token);
    return { message: 'Email da duoc xac minh' };
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async resendVerification(@Req() req: Request) {
    const { userId, email } = req.user as any;
    // Fetch user to get name
    await this.authService.resendVerification(userId, email, 'User');
    return { message: 'Email xac minh da duoc gui lai' };
  }

  // ---------------------
  // Password Reset
  // ---------------------

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ResetPasswordRequestDto) {
    await this.authService.forgotPassword(dto.email);
    // Always return 200 (security: don't leak whether email exists)
    return { message: 'Neu email ton tai, ban se nhan duoc lien ket dat lai mat khau.' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Mat khau da duoc dat lai thanh cong' };
  }

  // ---------------------
  // Google OAuth
  // ---------------------

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Guard triggers redirect to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const userAgent = req.headers['user-agent'] || 'unknown';
    const tokens = await this.authService.login({ id: user.id, email: user.email }, userAgent);
    this.authService.setCookies(res, tokens);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback`);
  }

  // ---------------------
  // Apple Sign-In
  // ---------------------

  @Post('apple')
  @UseGuards(AppleAuthGuard)
  async appleAuth() {
    // Guard triggers redirect to Apple
  }

  @Post('apple/callback')
  @UseGuards(AppleAuthGuard)
  async appleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const userAgent = req.headers['user-agent'] || 'unknown';
    const tokens = await this.authService.login({ id: user.id, email: user.email }, userAgent);
    this.authService.setCookies(res, tokens);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback`);
  }
}
