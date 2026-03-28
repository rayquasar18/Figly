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
export { NOTIFICATION_LIMITS } from './constants/notification.constants';

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

// Notification Types
export type {
  NotificationType,
  NotificationActorResponse,
  NotificationResponse,
  UnreadCountResponse,
} from './types/notification.types';

// Moderation Types
export type {
  ReportResponse,
  BlockedUserResponse,
  MutedUserResponse,
  ReportQueueItem,
  AdminActionResponse,
} from './types/moderation.types';

// Admin Types
export type {
  AdminReportQueueResponse,
  AdminUserActionResponse,
} from './types/admin.types';

// Moderation Constants
export { REPORT_REASONS, MODERATION_LIMITS } from './constants/moderation.constants';

// Moderation DTOs
export { createReportSchema, adminActionSchema } from './dto/moderation.dto';
export type { CreateReportDto, AdminActionDto } from './dto/moderation.dto';

// Messaging Constants
export { MESSAGING_LIMITS } from './constants/messaging.constants';

// Messaging DTOs
export { createConversationSchema, sendMessageSchema } from './dto/messaging.dto';
export type { CreateConversationDto, SendMessageDto } from './dto/messaging.dto';

// Messaging Types
export type {
  ConversationResponse,
  ConversationParticipantResponse,
  MessageResponse,
  MessageSender,
  MessageMediaItem,
  ConversationListResponse,
  MessageListResponse,
  UnreadTotalResponse,
} from './types/messaging.types';

// Story Constants
export { STORY_LIMITS } from './constants/story.constants';

// Story DTOs
export { createStorySchema } from './dto/story.dto';
export type { CreateStoryDto } from './dto/story.dto';

// Story Types
export type {
  StoryMediaItem,
  StoryResponse,
  StoryGroupResponse,
  StoryFeedResponse,
} from './types/story.types';
