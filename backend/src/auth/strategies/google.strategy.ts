import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('google.clientId') || 'google-client-id',
      clientSecret: configService.get<string>('google.clientSecret') || 'google-client-secret',
      callbackURL:
        configService.get<string>('google.callbackUrl') ||
        'http://localhost:4000/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, displayName } = profile;
    const email = emails?.[0]?.value;

    const user = await this.authService.handleGoogleLogin({
      googleId: id,
      email,
      name: displayName,
    });

    done(null, user);
  }
}
