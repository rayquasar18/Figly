export interface StoryMediaItem {
    id: string;
    url: string;
    type: 'image' | 'video';
    thumbnailUrl?: string;
}
export interface StoryResponse {
    id: string;
    media: StoryMediaItem[];
    isViewed: boolean;
    createdAt: string;
    expiresAt: string;
}
export interface StoryGroupResponse {
    user: {
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
    };
    stories: StoryResponse[];
    hasUnviewed: boolean;
    latestAt: string;
}
export interface StoryFeedResponse {
    myStories: StoryGroupResponse | null;
    followedStories: StoryGroupResponse[];
}
