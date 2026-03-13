import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt, StrategyOptionsWithRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req?.cookies?.refresh_token || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.refreshSecret') || 'dev-refresh-secret',
      passReqToCallback: true,
    } as StrategyOptionsWithRequest);
  }

  async validate(req: Request, payload: { sub: string }) {
    const refreshToken = req.cookies?.refresh_token;
    return { userId: payload.sub, refreshToken };
  }
}
