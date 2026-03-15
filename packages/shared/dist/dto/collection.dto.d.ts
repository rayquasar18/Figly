import { z } from 'zod';
export declare const searchItemsSchema: z.ZodObject<{
    q: z.ZodString;
    categoryId: z.ZodOptional<z.ZodString>;
    seriesId: z.ZodOptional<z.ZodString>;
    cursor: z.ZodOptional<z.ZodString>;
    take: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    q: string;
    take: number;
    categoryId?: string | undefined;
    seriesId?: string | undefined;
    cursor?: string | undefined;
}, {
    q: string;
    categoryId?: string | undefined;
    seriesId?: string | undefined;
    cursor?: string | undefined;
    take?: number | undefined;
}>;
export type SearchItemsDto = z.infer<typeof searchItemsSchema>;
