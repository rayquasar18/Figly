import { z } from 'zod';
export declare const createReportSchema: z.ZodObject<{
    targetId: z.ZodString;
    targetType: z.ZodEnum<["POST", "USER"]>;
    reason: z.ZodEnum<["SPAM", "HARASSMENT", "NUDITY", "VIOLENCE", "HATE_SPEECH", "SCAM", "MISINFORMATION"]>;
}, "strip", z.ZodTypeAny, {
    targetId: string;
    targetType: "USER" | "POST";
    reason: "SPAM" | "HARASSMENT" | "NUDITY" | "VIOLENCE" | "HATE_SPEECH" | "SCAM" | "MISINFORMATION";
}, {
    targetId: string;
    targetType: "USER" | "POST";
    reason: "SPAM" | "HARASSMENT" | "NUDITY" | "VIOLENCE" | "HATE_SPEECH" | "SCAM" | "MISINFORMATION";
}>;
export type CreateReportDto = z.infer<typeof createReportSchema>;
export declare const adminActionSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reason?: string | undefined;
}, {
    reason?: string | undefined;
}>;
export type AdminActionDto = z.infer<typeof adminActionSchema>;
