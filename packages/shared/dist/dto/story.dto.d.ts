import { z } from 'zod';
export declare const createStorySchema: z.ZodObject<{
    mediaId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    mediaId: string;
}, {
    mediaId: string;
}>;
export type CreateStoryDto = z.infer<typeof createStorySchema>;
