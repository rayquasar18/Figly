import { z } from 'zod';
export declare const createChecklistSchema: z.ZodObject<{
    name: z.ZodString;
    isPublic: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    isPublic: boolean;
}, {
    name: string;
    isPublic?: boolean | undefined;
}>;
export type CreateChecklistDto = z.infer<typeof createChecklistSchema>;
export declare const updateChecklistSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    isPublic: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    isPublic?: boolean | undefined;
}, {
    name?: string | undefined;
    isPublic?: boolean | undefined;
}>;
export type UpdateChecklistDto = z.infer<typeof updateChecklistSchema>;
export declare const addChecklistEntrySchema: z.ZodEffects<z.ZodObject<{
    itemId: z.ZodOptional<z.ZodString>;
    freeformText: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    itemId?: string | undefined;
    freeformText?: string | undefined;
}, {
    itemId?: string | undefined;
    freeformText?: string | undefined;
}>, {
    itemId?: string | undefined;
    freeformText?: string | undefined;
}, {
    itemId?: string | undefined;
    freeformText?: string | undefined;
}>;
export type AddChecklistEntryDto = z.infer<typeof addChecklistEntrySchema>;
export declare const reorderEntriesSchema: z.ZodObject<{
    entryIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    entryIds: string[];
}, {
    entryIds: string[];
}>;
export type ReorderEntriesDto = z.infer<typeof reorderEntriesSchema>;
