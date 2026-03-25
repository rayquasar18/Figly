"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommentSchema = void 0;
const zod_1 = require("zod");
const index_1 = require("../constants/index");
exports.createCommentSchema = zod_1.z.object({
    content: zod_1.z
        .string()
        .min(1, { message: 'Binh luan khong duoc de trong' })
        .max(index_1.POST_LIMITS.commentMaxLength, {
        message: `Binh luan toi da ${index_1.POST_LIMITS.commentMaxLength} ky tu`,
    }),
    parentId: zod_1.z.string().optional().nullable(),
});
