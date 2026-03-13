import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/auth.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { EmailVerifiedGuard } from './guards/email-verified.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    const user = await this.authService.signup(signupDto);
    // Email verification will be triggered in Task 2
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
    const tokens = await this.authService.login(
      { id: user.id, email: user.email },
      userAgent,
    );
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
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async me(@Req() req: Request) {
    const { userId } = req.user as any;
    // Will be enhanced with full user profile in later plans
    return { userId };
  }
}
