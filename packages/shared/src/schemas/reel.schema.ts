import { z } from 'zod';
import { REEL_LIMITS } from '../constants/reel.constants';

export const createReelSchema = z.object({
  mediaId: z.string().min(1, 'Media ID khong duoc de trong'),
  caption: z
    .string()
    .max(
      REEL_LIMITS.maxCaptionLength,
      `Chu thich khong duoc vuot qua ${REEL_LIMITS.maxCaptionLength} ky tu`,
    )
    .optional(),
  linkedItemIds: z.array(z.string()).optional(),
});

export type CreateReelInput = z.infer<typeof createReelSchema>;
