"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderEntriesSchema = exports.addChecklistEntrySchema = exports.updateChecklistSchema = exports.createChecklistSchema = void 0;
const zod_1 = require("zod");
exports.createChecklistSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Ten checklist khong duoc de trong').max(100, 'Ten checklist toi da 100 ky tu'),
    isPublic: zod_1.z.boolean().default(false),
});
exports.updateChecklistSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Ten checklist khong duoc de trong').max(100, 'Ten checklist toi da 100 ky tu').optional(),
    isPublic: zod_1.z.boolean().optional(),
});
exports.addChecklistEntrySchema = zod_1.z.object({
    itemId: zod_1.z.string().optional(),
    freeformText: zod_1.z.string().max(200, 'Noi dung toi da 200 ky tu').optional(),
}).refine(data => data.itemId || data.freeformText, {
    message: 'Phai co item hoac noi dung tu nhap',
});
exports.reorderEntriesSchema = zod_1.z.object({
    entryIds: zod_1.z.array(zod_1.z.string()).min(1, 'Danh sach khong duoc trong'),
});
