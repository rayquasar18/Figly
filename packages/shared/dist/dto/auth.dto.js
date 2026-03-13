"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmailSchema = exports.resetPasswordSchema = exports.resetPasswordRequestSchema = exports.loginSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
// Password validation helpers
const passwordSchema = zod_1.z
    .string()
    .min(8, { message: 'Mat khau phai co it nhat 8 ky tu' })
    .regex(/[a-zA-Z]/, { message: 'Mat khau phai chua chu cai' })
    .regex(/[0-9]/, { message: 'Mat khau phai chua so' });
exports.signupSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: 'Email khong hop le' }),
    password: passwordSchema,
    name: zod_1.z.string().min(1, { message: 'Ten khong duoc de trong' }),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: 'Email khong hop le' }),
    password: zod_1.z.string().min(1, { message: 'Mat khau khong duoc de trong' }),
});
exports.resetPasswordRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: 'Email khong hop le' }),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
    newPassword: passwordSchema,
});
exports.verifyEmailSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
});
