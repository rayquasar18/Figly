import { z } from 'zod';
export declare const USERNAME_RULES: {
    readonly minLength: 3;
    readonly maxLength: 30;
    readonly pattern: RegExp;
    readonly cooldownDays: 14;
};
export declare const RESERVED_USERNAMES: readonly ["api", "auth", "admin", "login", "signup", "settings", "explore", "search", "help", "about", "terms", "privacy", "notifications", "messages", "feed", "discover"];
export declare const usernameSchema: z.ZodString;
export declare const bioSchema: z.ZodString;
