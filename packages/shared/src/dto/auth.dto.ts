import { z } from 'zod';

// Password validation helpers
const passwordSchema = z
  .string()
  .min(8, { message: 'Mat khau phai co it nhat 8 ky tu' })
  .regex(/[a-zA-Z]/, { message: 'Mat khau phai chua chu cai' })
  .regex(/[0-9]/, { message: 'Mat khau phai chua so' });

export const signupSchema = z.object({
  email: z.string().email({ message: 'Email khong hop le' }),
  password: passwordSchema,
  name: z.string().min(1, { message: 'Ten khong duoc de trong' }),
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'Email khong hop le' }),
  password: z.string().min(1, { message: 'Mat khau khong duoc de trong' }),
});

export const resetPasswordRequestSchema = z.object({
  email: z.string().email({ message: 'Email khong hop le' }),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

// Inferred types
export type SignupDto = z.infer<typeof signupSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type ResetPasswordRequestDto = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;
