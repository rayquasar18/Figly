import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Allow unauthenticated requests through instead of throwing 401
  handleRequest(_err: any, user: any) {
    return user || null;
  }
}
