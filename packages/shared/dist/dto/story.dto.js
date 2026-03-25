"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStorySchema = void 0;
const zod_1 = require("zod");
exports.createStorySchema = zod_1.z.object({
    mediaId: zod_1.z.string().min(1, 'Media la bat buoc'),
});
