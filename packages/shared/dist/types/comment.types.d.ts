export interface CommentAuthor {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
}
export interface CommentResponse {
    id: string;
    author: CommentAuthor;
    content: string;
    parentId: string | null;
    replies: CommentResponse[];
    createdAt: string;
}
