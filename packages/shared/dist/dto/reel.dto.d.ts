import { z } from 'zod';
export declare const createReelSchema: z.ZodObject<{
    mediaId: z.ZodString;
    caption: z.ZodOptional<z.ZodString>;
    linkedItemIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    mediaId: string;
    caption?: string | undefined;
    linkedItemIds?: string[] | undefined;
}, {
    mediaId: string;
    caption?: string | undefined;
    linkedItemIds?: string[] | undefined;
}>;
export type CreateReelInput = z.infer<typeof createReelSchema>;
