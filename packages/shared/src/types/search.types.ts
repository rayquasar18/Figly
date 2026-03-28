import type { PostResponse } from './post.types';

export interface SearchUserResult {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface SearchHashtagResult {
  id: string;
  name: string;
  postCount: number;
}

export interface ExploreCategorySection {
  category: {
    id: string;
    name: string;
    slug: string;
  };
  posts: PostResponse[];
}
