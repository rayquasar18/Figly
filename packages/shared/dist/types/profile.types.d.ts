export interface ProfileResponse {
    id: string;
    username: string;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    postCount: number;
    followerCount: number;
    followingCount: number;
    isOwnProfile: boolean;
    isFollowing: boolean;
    isFollowedBy: boolean;
}
export interface UserListItem {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    isFollowing: boolean;
}
export interface PaginatedResponse<T> {
    items: T[];
    nextCursor: string | null;
    hasMore: boolean;
}
