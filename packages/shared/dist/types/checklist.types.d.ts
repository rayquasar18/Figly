export interface ChecklistResponse {
    id: string;
    name: string;
    isPublic: boolean;
    totalEntries: number;
    checkedEntries: number;
    createdAt: string;
    updatedAt: string;
}
export interface ChecklistEntryResponse {
    id: string;
    checklistId: string;
    itemId: string | null;
    itemName: string | null;
    itemImageUrl: string | null;
    freeformText: string | null;
    isChecked: boolean;
    position: number;
}
export interface ChecklistDetailResponse extends ChecklistResponse {
    entries: ChecklistEntryResponse[];
}
