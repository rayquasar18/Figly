import { z } from 'zod';

export const searchItemsSchema = z.object({
  q: z.string().min(1, 'Vui long nhap tu khoa tim kiem'),
  categoryId: z.string().optional(),
  seriesId: z.string().optional(),
  cursor: z.string().optional(),
  take: z.coerce.number().min(1).max(50).default(20),
});
export type SearchItemsDto = z.infer<typeof searchItemsSchema>;
