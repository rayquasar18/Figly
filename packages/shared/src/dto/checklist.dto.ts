import { z } from 'zod';

export const createChecklistSchema = z.object({
  name: z.string().min(1, 'Ten checklist khong duoc de trong').max(100, 'Ten checklist toi da 100 ky tu'),
  isPublic: z.boolean().default(false),
});
export type CreateChecklistDto = z.infer<typeof createChecklistSchema>;

export const updateChecklistSchema = z.object({
  name: z.string().min(1, 'Ten checklist khong duoc de trong').max(100, 'Ten checklist toi da 100 ky tu').optional(),
  isPublic: z.boolean().optional(),
});
export type UpdateChecklistDto = z.infer<typeof updateChecklistSchema>;

export const addChecklistEntrySchema = z.object({
  itemId: z.string().optional(),
  freeformText: z.string().max(200, 'Noi dung toi da 200 ky tu').optional(),
}).refine(data => data.itemId || data.freeformText, {
  message: 'Phai co item hoac noi dung tu nhap',
});
export type AddChecklistEntryDto = z.infer<typeof addChecklistEntrySchema>;

export const reorderEntriesSchema = z.object({
  entryIds: z.array(z.string()).min(1, 'Danh sach khong duoc trong'),
});
export type ReorderEntriesDto = z.infer<typeof reorderEntriesSchema>;
