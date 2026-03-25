import { z } from 'zod';
export declare const createConversationSchema: z.ZodObject<{
    participantIds: z.ZodArray<z.ZodString, "many">;
    isGroup: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    participantIds: string[];
    isGroup: boolean;
    name?: string | undefined;
    description?: string | undefined;
    categoryId?: string | undefined;
}, {
    participantIds: string[];
    isGroup?: boolean | undefined;
    name?: string | undefined;
    description?: string | undefined;
    categoryId?: string | undefined;
}>;
export type CreateConversationDto = z.infer<typeof createConversationSchema>;
export declare const sendMessageSchema: z.ZodEffects<z.ZodObject<{
    content: z.ZodOptional<z.ZodString>;
    mediaIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    content?: string | undefined;
    mediaIds?: string[] | undefined;
}, {
    content?: string | undefined;
    mediaIds?: string[] | undefined;
}>, {
    content?: string | undefined;
    mediaIds?: string[] | undefined;
}, {
    content?: string | undefined;
    mediaIds?: string[] | undefined;
}>;
export type SendMessageDto = z.infer<typeof sendMessageSchema>;
