import { z } from 'zod';
export declare const createCommentSchema: z.ZodObject<{
    content: z.ZodString;
    parentId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    content: string;
    parentId?: string | null | undefined;
}, {
    content: string;
    parentId?: string | null | undefined;
}>;
export type CreateCommentDto = z.infer<typeof createCommentSchema>;
