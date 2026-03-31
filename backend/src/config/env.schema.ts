import { z } from 'zod';

const envSchema = z.object({
  // Required -- no defaults, app fails to start without these
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid URL' }),
  JWT_ACCESS_SECRET: z
    .string()
    .min(16, { message: 'JWT_ACCESS_SECRET must be at least 16 characters' }),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16, { message: 'JWT_REFRESH_SECRET must be at least 16 characters' }),

  // Optional with safe defaults
  REDIS_URL: z.string().default('redis://localhost:6379'),
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // MinIO -- defaults for local dev
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_ACCESS_KEY: z.string().default('minioadmin'),
  MINIO_SECRET_KEY: z.string().default('minioadmin'),
  MINIO_BUCKET: z.string().default('figly-media'),

  // Optional services -- empty string = disabled
  RESEND_API_KEY: z.string().default(''),
  RESEND_FROM_ADDRESS: z.string().default('Figly <onboarding@resend.dev>'),
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  GOOGLE_CALLBACK_URL: z.string().default('http://localhost:4000/api/auth/google/callback'),
  APPLE_CLIENT_ID: z.string().default(''),
  APPLE_TEAM_ID: z.string().default(''),
  APPLE_KEY_ID: z.string().default(''),
  APPLE_PRIVATE_KEY: z.string().default(''),
  APPLE_CALLBACK_URL: z.string().default('http://localhost:4000/api/auth/apple/callback'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`\nEnvironment validation failed:\n${formatted}\n\nApplication cannot start.`);
  }
  return result.data;
}
