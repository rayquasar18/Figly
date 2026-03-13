"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.THUMBNAIL_SIZES = exports.FILE_LIMITS = exports.TOKEN_EXPIRY = exports.validatePassword = exports.passwordRegex = exports.PASSWORD_MIN_LENGTH = exports.verifyEmailSchema = exports.resetPasswordSchema = exports.resetPasswordRequestSchema = exports.loginSchema = exports.signupSchema = void 0;
// DTOs
var auth_dto_1 = require("./dto/auth.dto");
Object.defineProperty(exports, "signupSchema", { enumerable: true, get: function () { return auth_dto_1.signupSchema; } });
Object.defineProperty(exports, "loginSchema", { enumerable: true, get: function () { return auth_dto_1.loginSchema; } });
Object.defineProperty(exports, "resetPasswordRequestSchema", { enumerable: true, get: function () { return auth_dto_1.resetPasswordRequestSchema; } });
Object.defineProperty(exports, "resetPasswordSchema", { enumerable: true, get: function () { return auth_dto_1.resetPasswordSchema; } });
Object.defineProperty(exports, "verifyEmailSchema", { enumerable: true, get: function () { return auth_dto_1.verifyEmailSchema; } });
// Validators
var password_1 = require("./validators/password");
Object.defineProperty(exports, "PASSWORD_MIN_LENGTH", { enumerable: true, get: function () { return password_1.PASSWORD_MIN_LENGTH; } });
Object.defineProperty(exports, "passwordRegex", { enumerable: true, get: function () { return password_1.passwordRegex; } });
Object.defineProperty(exports, "validatePassword", { enumerable: true, get: function () { return password_1.validatePassword; } });
// Constants
var index_1 = require("./constants/index");
Object.defineProperty(exports, "TOKEN_EXPIRY", { enumerable: true, get: function () { return index_1.TOKEN_EXPIRY; } });
Object.defineProperty(exports, "FILE_LIMITS", { enumerable: true, get: function () { return index_1.FILE_LIMITS; } });
Object.defineProperty(exports, "THUMBNAIL_SIZES", { enumerable: true, get: function () { return index_1.THUMBNAIL_SIZES; } });
