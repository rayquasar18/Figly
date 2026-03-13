"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.THUMBNAIL_SIZES = exports.FILE_LIMITS = exports.TOKEN_EXPIRY = void 0;
exports.TOKEN_EXPIRY = {
    access: '15m',
    accessSeconds: 15 * 60,
    refresh: '30d',
    refreshSeconds: 30 * 24 * 60 * 60,
    emailVerification: '24h',
    emailVerificationSeconds: 24 * 60 * 60,
    passwordReset: '1h',
    passwordResetSeconds: 60 * 60,
};
exports.FILE_LIMITS = {
    image: 10 * 1024 * 1024, // 10MB
    video: 100 * 1024 * 1024, // 100MB
};
exports.THUMBNAIL_SIZES = {
    small: 150,
    medium: 600,
    large: 1080,
};
