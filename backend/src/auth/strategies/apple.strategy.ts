import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

/**
 * Apple Sign-In strategy.
 * Note: Apple uses POST callback (not GET), and may not provide name on subsequent logins.
 *
 * passport-apple provides the Strategy class.
 * Apple Sign-In requires: clientID, teamID, keyID, privateKeyString, callbackURL.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
let ApplePassportStrategy: any;
try {
  ApplePassportStrategy = require('passport-apple').Strategy;
} catch {
  // Fallback for when passport-apple is not properly installed
  ApplePassportStrategy = class DummyStrategy {
    constructor() {}
  };
}

@Injectable()
export class AppleStrategy extends PassportStrategy(ApplePassportStrategy, 'apple') {
  constructor(
    private authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('apple.clientId') || 'apple-client-id',
      teamID: configService.get<string>('apple.teamId') || 'apple-team-id',
      keyID: configService.get<string>('apple.keyId') || 'apple-key-id',
      privateKeyString: configService.get<string>('apple.privateKey') || 'apple-private-key',
      callbackURL: configService.get<string>('apple.callbackUrl') || 'http://localhost:4000/api/auth/apple/callback',
      scope: ['name', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    idToken: any,
    profile: any,
    done: any,
  ): Promise<any> {
    const appleId = idToken?.sub || profile?.id;
    const email = idToken?.email || profile?.email;
    // Apple only provides name on first login
    const name = profile?.name
      ? `${profile.name.firstName || ''} ${profile.name.lastName || ''}`.trim()
      : undefined;

    const user = await this.authService.handleAppleLogin({
      appleId,
      email,
      name,
    });

    done(null, user);
  }
}
