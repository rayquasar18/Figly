export declare const TOKEN_EXPIRY: {
    readonly access: "15m";
    readonly accessSeconds: number;
    readonly refresh: "30d";
    readonly refreshSeconds: number;
    readonly emailVerification: "24h";
    readonly emailVerificationSeconds: number;
    readonly passwordReset: "1h";
    readonly passwordResetSeconds: number;
};
export declare const FILE_LIMITS: {
    readonly image: number;
    readonly video: number;
};
export declare const THUMBNAIL_SIZES: {
    readonly small: 150;
    readonly medium: 600;
    readonly large: 1080;
};
export declare const PROFILE_LIMITS: {
    readonly bioMaxLength: 150;
    readonly usernameMinLength: 3;
    readonly usernameMaxLength: 30;
    readonly usernameCooldownDays: 14;
};
export declare const POST_LIMITS: {
    readonly maxImages: 10;
    readonly captionMaxLength: 2200;
    readonly commentMaxLength: 1000;
    readonly feedPageSize: 10;
    readonly commentsPageSize: 20;
};
export declare const COLLECTION_LIMITS: {
    readonly itemsPageSize: 20;
    readonly seriesPageSize: 20;
    readonly searchResultsLimit: 20;
    readonly checklistNameMaxLength: 100;
    readonly freeformTextMaxLength: 200;
    readonly maxChecklistEntries: 100;
};
export { REEL_LIMITS } from './reel.constants';
