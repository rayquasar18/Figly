import { z } from 'zod';
export declare const updateProfileSchema: z.ZodObject<{
    displayName: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    avatarId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    displayName?: string | undefined;
    username?: string | undefined;
    bio?: string | null | undefined;
    avatarId?: string | undefined;
}, {
    displayName?: string | undefined;
    username?: string | undefined;
    bio?: string | null | undefined;
    avatarId?: string | undefined;
}>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
