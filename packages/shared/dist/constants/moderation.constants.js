"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODERATION_LIMITS = exports.REPORT_REASONS = void 0;
exports.REPORT_REASONS = [
    { value: 'SPAM', label: 'Spam' },
    { value: 'HARASSMENT', label: 'Quay roi / bat nat' },
    { value: 'NUDITY', label: 'Khoa than / tinh duc' },
    { value: 'VIOLENCE', label: 'Bao luc' },
    { value: 'HATE_SPEECH', label: 'Ngon tu thu han' },
    { value: 'SCAM', label: 'Lua dao' },
    { value: 'MISINFORMATION', label: 'Thong tin sai lech' },
];
exports.MODERATION_LIMITS = {
    blockedPageSize: 20,
    mutedPageSize: 20,
    reportQueuePageSize: 20,
};
