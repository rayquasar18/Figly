// Schemas
export {
  signupSchema,
  loginSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './schemas/auth.schema';

export type {
  SignupDto,
  LoginDto,
  ResetPasswordRequestDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './schemas/auth.schema';

export { updateProfileSchema } from './schemas/profile.schema';
export type { UpdateProfileDto } from './schemas/profile.schema';

export { createPostSchema, updateCaptionSchema } from './schemas/post.schema';
export type { CreatePostDto, UpdateCaptionDto } from './schemas/post.schema';

export { createCommentSchema } from './schemas/comment.schema';
export type { CreateCommentDto } from './schemas/comment.schema';

// Types
export type { TokenPair, JwtPayload, AuthResponse } from './types/auth.types';
export type { PublicUser } from './types/user.types';
export type { ProfileResponse, UserListItem, PaginatedResponse } from './types/profile.types';
export type { PostResponse, PostMediaItem, PostAuthor, FeedPostResponse } from './types/post.types';
export type { CommentResponse, CommentAuthor } from './types/comment.types';
export type { ToggleResponse } from './types/interaction.types';

// Validators
export { PASSWORD_MIN_LENGTH, passwordRegex, validatePassword } from './validators/password';
export {
  USERNAME_RULES,
  RESERVED_USERNAMES,
  usernameSchema,
  bioSchema,
} from './validators/username';

// Constants
export {
  TOKEN_EXPIRY,
  FILE_LIMITS,
  THUMBNAIL_SIZES,
  PROFILE_LIMITS,
  POST_LIMITS,
  COLLECTION_LIMITS,
  REEL_LIMITS,
} from './constants/index';

// Collection schemas
export { searchItemsSchema } from './schemas/collection.schema';
export type { SearchItemsDto } from './schemas/collection.schema';

// Checklist schemas
export {
  createChecklistSchema,
  updateChecklistSchema,
  addChecklistEntrySchema,
  reorderEntriesSchema,
} from './schemas/checklist.schema';
export type {
  CreateChecklistDto,
  UpdateChecklistDto,
  AddChecklistEntryDto,
  ReorderEntriesDto,
} from './schemas/checklist.schema';

// Reel schemas (was missing from barrel -- fixed during rename)
export { createReelSchema } from './schemas/reel.schema';
export type { CreateReelInput } from './schemas/reel.schema';

// Collection Types
export type {
  CategoryResponse,
  SeriesResponse,
  ItemResponse,
  ItemDetailResponse,
  LinkedItemResponse,
} from './types/collection.types';

// Checklist Types
export type {
  ChecklistResponse,
  ChecklistEntryResponse,
  ChecklistDetailResponse,
} from './types/checklist.types';
