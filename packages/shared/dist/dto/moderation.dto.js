"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminActionSchema = exports.createReportSchema = void 0;
const zod_1 = require("zod");
exports.createReportSchema = zod_1.z.object({
    targetId: zod_1.z.string().min(1, 'ID muc tieu la bat buoc'),
    targetType: zod_1.z.enum(['POST', 'USER'], { required_error: 'Loai muc tieu la bat buoc' }),
    reason: zod_1.z.enum(['SPAM', 'HARASSMENT', 'NUDITY', 'VIOLENCE', 'HATE_SPEECH', 'SCAM', 'MISINFORMATION'], { required_error: 'Ly do bao cao la bat buoc' }),
});
exports.adminActionSchema = zod_1.z.object({
    reason: zod_1.z.string().optional(),
});
