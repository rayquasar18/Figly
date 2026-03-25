"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bioSchema = exports.usernameSchema = exports.RESERVED_USERNAMES = exports.USERNAME_RULES = void 0;
const zod_1 = require("zod");
exports.USERNAME_RULES = {
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-z0-9_.]+$/,
    cooldownDays: 14,
};
exports.RESERVED_USERNAMES = [
    'api',
    'auth',
    'admin',
    'login',
    'signup',
    'settings',
    'explore',
    'search',
    'help',
    'about',
    'terms',
    'privacy',
    'notifications',
    'messages',
    'feed',
    'discover',
];
exports.usernameSchema = zod_1.z
    .string()
    .min(exports.USERNAME_RULES.minLength, {
    message: `Ten nguoi dung phai co it nhat ${exports.USERNAME_RULES.minLength} ky tu`,
})
    .max(exports.USERNAME_RULES.maxLength, {
    message: `Ten nguoi dung khong duoc vuot qua ${exports.USERNAME_RULES.maxLength} ky tu`,
})
    .regex(exports.USERNAME_RULES.pattern, {
    message: 'Ten nguoi dung chi chua chu thuong, so, dau gach duoi va dau cham',
});
exports.bioSchema = zod_1.z.string().max(150, { message: 'Tieu su khong duoc vuot qua 150 ky tu' });
