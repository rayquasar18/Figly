import { z } from 'zod';
import { POST_LIMITS } from '../constants/index';

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, { message: 'Binh luan khong duoc de trong' })
    .max(POST_LIMITS.commentMaxLength, {
      message: `Binh luan toi da ${POST_LIMITS.commentMaxLength} ky tu`,
    }),
  parentId: z.string().optional().nullable(),
});

export type CreateCommentDto = z.infer<typeof createCommentSchema>;
