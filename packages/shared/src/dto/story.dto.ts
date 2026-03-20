import { z } from 'zod';

export const createStorySchema = z.object({
  mediaId: z.string().min(1, 'Media la bat buoc'),
});

export type CreateStoryDto = z.infer<typeof createStorySchema>;
