import { z } from 'zod';
import { POST_LIMITS } from '../constants/index';

export const createPostSchema = z.object({
  mediaIds: z
    .array(z.string())
    .min(1, { message: 'Can it nhat 1 hinh anh' })
    .max(POST_LIMITS.maxImages, {
      message: `Toi da ${POST_LIMITS.maxImages} hinh anh`,
    }),
  caption: z
    .string()
    .max(POST_LIMITS.captionMaxLength, {
      message: `Caption toi da ${POST_LIMITS.captionMaxLength} ky tu`,
    })
    .optional()
    .nullable(),
});

export const updateCaptionSchema = z.object({
  caption: z
    .string()
    .max(POST_LIMITS.captionMaxLength, {
      message: `Caption toi da ${POST_LIMITS.captionMaxLength} ky tu`,
    })
    .optional()
    .nullable(),
});

export type CreatePostDto = z.infer<typeof createPostSchema>;
export type UpdateCaptionDto = z.infer<typeof updateCaptionSchema>;
