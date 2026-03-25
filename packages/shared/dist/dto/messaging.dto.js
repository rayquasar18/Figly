"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageSchema = exports.createConversationSchema = void 0;
const zod_1 = require("zod");
const messaging_constants_1 = require("../constants/messaging.constants");
exports.createConversationSchema = zod_1.z.object({
    participantIds: zod_1.z
        .array(zod_1.z.string())
        .min(1)
        .max(messaging_constants_1.MESSAGING_LIMITS.maxGroupParticipants - 1),
    isGroup: zod_1.z.boolean().optional().default(false),
    name: zod_1.z
        .string()
        .max(messaging_constants_1.MESSAGING_LIMITS.conversationNameMaxLength)
        .optional(),
    description: zod_1.z
        .string()
        .max(messaging_constants_1.MESSAGING_LIMITS.conversationDescriptionMaxLength)
        .optional(),
    categoryId: zod_1.z.string().optional(),
});
exports.sendMessageSchema = zod_1.z
    .object({
    content: zod_1.z
        .string()
        .max(messaging_constants_1.MESSAGING_LIMITS.messageMaxLength)
        .optional(),
    mediaIds: zod_1.z
        .array(zod_1.z.string())
        .max(messaging_constants_1.MESSAGING_LIMITS.maxMediaPerMessage)
        .optional(),
})
    .refine((data) => data.content || (data.mediaIds && data.mediaIds.length > 0), {
    message: 'Tin nhan can co noi dung hoac media',
});
