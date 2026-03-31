import { z } from 'zod';

export const USERNAME_RULES = {
  minLength: 3,
  maxLength: 30,
  pattern: /^[a-z0-9_.]+$/,
  cooldownDays: 14,
} as const;

export const RESERVED_USERNAMES = [
  'api',
  'auth',
  'admin',
  'login',
  'signup',
  'settings',
  'explore',
  'search',
  'help',
  'about',
  'terms',
  'privacy',
  'notifications',
  'messages',
  'feed',
  'discover',
] as const;

export const usernameSchema = z
  .string()
  .min(USERNAME_RULES.minLength, {
    message: `Ten nguoi dung phai co it nhat ${USERNAME_RULES.minLength} ky tu`,
  })
  .max(USERNAME_RULES.maxLength, {
    message: `Ten nguoi dung khong duoc vuot qua ${USERNAME_RULES.maxLength} ky tu`,
  })
  .regex(USERNAME_RULES.pattern, {
    message: 'Ten nguoi dung chi chua chu thuong, so, dau gach duoi va dau cham',
  });

export const bioSchema = z.string().max(150, { message: 'Tieu su khong duoc vuot qua 150 ky tu' });
