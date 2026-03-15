// DTOs
export {
  signupSchema,
  loginSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './dto/auth.dto';

export type {
  SignupDto,
  LoginDto,
  ResetPasswordRequestDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';

export { updateProfileSchema } from './dto/profile.dto';
export type { UpdateProfileDto } from './dto/profile.dto';

export { createPostSchema, updateCaptionSchema } from './dto/post.dto';
export type { CreatePostDto, UpdateCaptionDto } from './dto/post.dto';

export { createCommentSchema } from './dto/comment.dto';
export type { CreateCommentDto } from './dto/comment.dto';

// Types
export type { TokenPair, JwtPayload, AuthResponse } from './types/auth.types';
export type { PublicUser } from './types/user.types';
export type { ProfileResponse, UserListItem, PaginatedResponse } from './types/profile.types';
export type { PostResponse, PostMediaItem, PostAuthor, FeedPostResponse } from './types/post.types';
export type { CommentResponse, CommentAuthor } from './types/comment.types';
export type { ToggleResponse } from './types/interaction.types';

// Validators
export { PASSWORD_MIN_LENGTH, passwordRegex, validatePassword } from './validators/password';
export { USERNAME_RULES, RESERVED_USERNAMES, usernameSchema, bioSchema } from './validators/username';

// Constants
export { TOKEN_EXPIRY, FILE_LIMITS, THUMBNAIL_SIZES, PROFILE_LIMITS, POST_LIMITS, COLLECTION_LIMITS } from './constants/index';

// Collection DTOs
export { searchItemsSchema } from './dto/collection.dto';
export type { SearchItemsDto } from './dto/collection.dto';

// Checklist DTOs
export {
  createChecklistSchema,
  updateChecklistSchema,
  addChecklistEntrySchema,
  reorderEntriesSchema,
} from './dto/checklist.dto';
export type {
  CreateChecklistDto,
  UpdateChecklistDto,
  AddChecklistEntryDto,
  ReorderEntriesDto,
} from './dto/checklist.dto';

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

// Search Types
export type {
  SearchUserResult,
  SearchHashtagResult,
  ExploreCategorySection,
} from './types/search.types';
