export const STORY_LIMITS = {
  maxDurationSeconds: 15,
  maxVideoSize: 30 * 1024 * 1024, // 30MB
  maxImageSize: 10 * 1024 * 1024, // 10MB (same as FILE_LIMITS.image)
  expiryHours: 24,
  maxMediaPerStory: 1,
  feedPageSize: 30,
} as const;
