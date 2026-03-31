import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Schema for user data in auth responses (signup)
const authUserResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string().nullable(),
  name: z.string().nullable(),
  emailVerified: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// Schema for user data in login/me responses
const userResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  emailVerified: z.boolean(),
});

// Schema for signup response wrapper
const signupResponseSchema = z.object({
  message: z.string(),
  user: authUserResponseSchema,
});

// Schema for login response wrapper
const loginResponseSchema = z.object({
  user: userResponseSchema,
});

// Schema for getMe response wrapper
const meResponseSchema = z.object({
  user: userResponseSchema,
});

export class AuthUserResponseDto extends createZodDto(authUserResponseSchema) {}
export class UserResponseDto extends createZodDto(userResponseSchema) {}
export class SignupResponseDto extends createZodDto(signupResponseSchema) {}
export class LoginResponseDto extends createZodDto(loginResponseSchema) {}
export class MeResponseDto extends createZodDto(meResponseSchema) {}

// Re-export schemas for testing
export {
  authUserResponseSchema,
  userResponseSchema,
  signupResponseSchema,
  loginResponseSchema,
  meResponseSchema,
};
