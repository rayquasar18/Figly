"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchItemsSchema = void 0;
const zod_1 = require("zod");
exports.searchItemsSchema = zod_1.z.object({
    q: zod_1.z.string().min(1, 'Vui long nhap tu khoa tim kiem'),
    categoryId: zod_1.z.string().optional(),
    seriesId: zod_1.z.string().optional(),
    cursor: zod_1.z.string().optional(),
    take: zod_1.z.coerce.number().min(1).max(50).default(20),
});
