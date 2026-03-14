export const TOKEN_EXPIRY = {
  access: '15m',
  accessSeconds: 15 * 60,
  refresh: '30d',
  refreshSeconds: 30 * 24 * 60 * 60,
  emailVerification: '24h',
  emailVerificationSeconds: 24 * 60 * 60,
  passwordReset: '1h',
  passwordResetSeconds: 60 * 60,
} as const;

export const FILE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
} as const;

export const THUMBNAIL_SIZES = {
  small: 150,
  medium: 600,
  large: 1080,
} as const;

export const PROFILE_LIMITS = {
  bioMaxLength: 150,
  usernameMinLength: 3,
  usernameMaxLength: 30,
  usernameCooldownDays: 14,
} as const;

export const POST_LIMITS = {
  maxImages: 10,
  captionMaxLength: 2200,
  commentMaxLength: 1000,
  feedPageSize: 10,
  commentsPageSize: 20,
} as const;
