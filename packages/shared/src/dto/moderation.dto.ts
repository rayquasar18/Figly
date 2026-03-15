import { z } from 'zod';

export const createReportSchema = z.object({
  targetId: z.string().min(1, 'ID muc tieu la bat buoc'),
  targetType: z.enum(['POST', 'USER'], { required_error: 'Loai muc tieu la bat buoc' }),
  reason: z.enum(
    ['SPAM', 'HARASSMENT', 'NUDITY', 'VIOLENCE', 'HATE_SPEECH', 'SCAM', 'MISINFORMATION'],
    { required_error: 'Ly do bao cao la bat buoc' },
  ),
});

export type CreateReportDto = z.infer<typeof createReportSchema>;

export const adminActionSchema = z.object({
  reason: z.string().optional(),
});

export type AdminActionDto = z.infer<typeof adminActionSchema>;
