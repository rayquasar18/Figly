import { z } from 'zod';
import { MESSAGING_LIMITS } from '../constants/messaging.constants';

export const createConversationSchema = z.object({
  participantIds: z
    .array(z.string())
    .min(1)
    .max(MESSAGING_LIMITS.maxGroupParticipants - 1),
  isGroup: z.boolean().optional().default(false),
  name: z
    .string()
    .max(MESSAGING_LIMITS.conversationNameMaxLength)
    .optional(),
  description: z
    .string()
    .max(MESSAGING_LIMITS.conversationDescriptionMaxLength)
    .optional(),
  categoryId: z.string().optional(),
});

export type CreateConversationDto = z.infer<typeof createConversationSchema>;

export const sendMessageSchema = z
  .object({
    content: z
      .string()
      .max(MESSAGING_LIMITS.messageMaxLength)
      .optional(),
    mediaIds: z
      .array(z.string())
      .max(MESSAGING_LIMITS.maxMediaPerMessage)
      .optional(),
  })
  .refine((data) => data.content || (data.mediaIds && data.mediaIds.length > 0), {
    message: 'Tin nhan can co noi dung hoac media',
  });

export type SendMessageDto = z.infer<typeof sendMessageSchema>;
