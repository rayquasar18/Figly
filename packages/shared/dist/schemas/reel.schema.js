"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReelSchema = void 0;
const zod_1 = require("zod");
const reel_constants_1 = require("../constants/reel.constants");
exports.createReelSchema = zod_1.z.object({
    mediaId: zod_1.z.string().min(1, 'Media ID khong duoc de trong'),
    caption: zod_1.z
        .string()
        .max(reel_constants_1.REEL_LIMITS.maxCaptionLength, `Chu thich khong duoc vuot qua ${reel_constants_1.REEL_LIMITS.maxCaptionLength} ky tu`)
        .optional(),
    linkedItemIds: zod_1.z.array(zod_1.z.string()).optional(),
});
