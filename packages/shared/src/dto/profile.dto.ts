import { z } from 'zod';
import { usernameSchema, bioSchema } from '../validators/username';

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, { message: 'Ten hien thi khong duoc de trong' })
    .max(50, { message: 'Ten hien thi khong duoc vuot qua 50 ky tu' })
    .optional(),
  username: usernameSchema.optional(),
  bio: bioSchema.nullable().optional(),
  avatarId: z.string().optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
