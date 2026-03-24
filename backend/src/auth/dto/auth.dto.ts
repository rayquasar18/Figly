import { createZodDto } from 'nestjs-zod';
import {
  signupSchema,
  loginSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@figly/shared';

export class SignupDto extends createZodDto(signupSchema) {}
export class LoginDto extends createZodDto(loginSchema) {}
export class ResetPasswordRequestDto extends createZodDto(resetPasswordRequestSchema) {}
export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
export class VerifyEmailDto extends createZodDto(verifyEmailSchema) {}
