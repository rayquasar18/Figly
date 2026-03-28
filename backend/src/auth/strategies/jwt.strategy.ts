import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private prisma: PrismaService;

  constructor(configService: ConfigService, prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req?.cookies?.access_token || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret') || 'dev-access-secret',
    });
    this.prisma = prisma;
  }

  async validate(payload: { sub: string; email: string }) {
    // Check ban status from database
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { isBanned: true },
    });

    if (user?.isBanned) {
      throw new UnauthorizedException('Tai khoan cua ban da bi cam');
    }

    return { userId: payload.sub, email: payload.email };
  }
}
