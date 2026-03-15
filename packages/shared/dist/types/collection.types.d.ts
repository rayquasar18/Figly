export interface CategoryResponse {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    coverImage: string | null;
    seriesCount: number;
    itemCount: number;
}
export interface SeriesResponse {
    id: string;
    categoryId: string;
    name: string;
    slug: string;
    description: string | null;
    coverImage: string | null;
    itemCount: number;
    isFollowed?: boolean;
}
export interface ItemResponse {
    id: string;
    seriesId: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    releaseDate: string | null;
    seriesName: string;
    categoryName: string;
    isOwned: boolean;
    isWishlisted: boolean;
}
export interface ItemDetailResponse extends ItemResponse {
    ownerCount: number;
    categorySlug: string;
    seriesSlug: string;
}
export interface LinkedItemResponse {
    id: string;
    name: string;
    seriesName: string;
    categoryName: string;
    imageUrl: string | null;
}
