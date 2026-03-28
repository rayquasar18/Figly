import { z } from 'zod';
export declare const createPostSchema: z.ZodObject<{
    mediaIds: z.ZodArray<z.ZodString, "many">;
    caption: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    linkedItemIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    mediaIds: string[];
    caption?: string | null | undefined;
    linkedItemIds?: string[] | undefined;
}, {
    mediaIds: string[];
    caption?: string | null | undefined;
    linkedItemIds?: string[] | undefined;
}>;
export declare const updateCaptionSchema: z.ZodObject<{
    caption: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    caption?: string | null | undefined;
}, {
    caption?: string | null | undefined;
}>;
export type CreatePostDto = z.infer<typeof createPostSchema>;
export type UpdateCaptionDto = z.infer<typeof updateCaptionSchema>;
