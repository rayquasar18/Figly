"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordRegex = exports.PASSWORD_MIN_LENGTH = void 0;
exports.validatePassword = validatePassword;
exports.PASSWORD_MIN_LENGTH = 8;
exports.passwordRegex = {
    hasLetter: /[a-zA-Z]/,
    hasNumber: /[0-9]/,
};
function validatePassword(password) {
    const errors = [];
    if (password.length < exports.PASSWORD_MIN_LENGTH) {
        errors.push('Mat khau phai co it nhat 8 ky tu');
    }
    if (!exports.passwordRegex.hasLetter.test(password)) {
        errors.push('Mat khau phai chua chu cai');
    }
    if (!exports.passwordRegex.hasNumber.test(password)) {
        errors.push('Mat khau phai chua so');
    }
    return { valid: errors.length === 0, errors };
}
