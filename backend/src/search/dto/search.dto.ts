// Search DTOs -- query params are validated inline in controller
// No Zod schemas needed; search params are simple strings
export interface SearchQueryDto {
  q?: string;
  limit?: string;
  cursor?: string;
}
