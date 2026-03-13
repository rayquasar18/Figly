export declare const PASSWORD_MIN_LENGTH = 8;
export declare const passwordRegex: {
    hasLetter: RegExp;
    hasNumber: RegExp;
};
export declare function validatePassword(password: string): {
    valid: boolean;
    errors: string[];
};
