import type { LinkedItemResponse } from './collection.types';

export interface PostMediaItem {
  id: string;
  mediaId: string;
  position: number;
  url: string;
}

export interface PostAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface ReelMetaResponse {
  duration: number;
  thumbnailUrl: string | null;
  width: number;
  height: number;
}

export interface PostResponse {
  id: string;
  author: PostAuthor;
  caption: string | null;
  media: PostMediaItem[];
  linkedItems?: LinkedItemResponse[];
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
  updatedAt: string;
  postType?: 'POST' | 'REEL';
  reelMeta?: ReelMetaResponse | null;
}

export type FeedPostResponse = PostResponse;
