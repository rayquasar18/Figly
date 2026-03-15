"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCaptionSchema = exports.createPostSchema = void 0;
const zod_1 = require("zod");
const index_1 = require("../constants/index");
exports.createPostSchema = zod_1.z.object({
    mediaIds: zod_1.z
        .array(zod_1.z.string())
        .min(1, { message: 'Can it nhat 1 hinh anh' })
        .max(index_1.POST_LIMITS.maxImages, {
        message: `Toi da ${index_1.POST_LIMITS.maxImages} hinh anh`,
    }),
    caption: zod_1.z
        .string()
        .max(index_1.POST_LIMITS.captionMaxLength, {
        message: `Caption toi da ${index_1.POST_LIMITS.captionMaxLength} ky tu`,
    })
        .optional()
        .nullable(),
    linkedItemIds: zod_1.z
        .array(zod_1.z.string())
        .max(10, { message: 'Toi da 10 vat pham lien ket' })
        .optional(),
});
exports.updateCaptionSchema = zod_1.z.object({
    caption: zod_1.z
        .string()
        .max(index_1.POST_LIMITS.captionMaxLength, {
        message: `Caption toi da ${index_1.POST_LIMITS.captionMaxLength} ky tu`,
    })
        .optional()
        .nullable(),
});
