"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
const username_1 = require("../validators/username");
exports.updateProfileSchema = zod_1.z.object({
    displayName: zod_1.z
        .string()
        .min(1, { message: 'Ten hien thi khong duoc de trong' })
        .max(50, { message: 'Ten hien thi khong duoc vuot qua 50 ky tu' })
        .optional(),
    username: username_1.usernameSchema.optional(),
    bio: username_1.bioSchema.nullable().optional(),
    avatarId: zod_1.z.string().optional(),
});
