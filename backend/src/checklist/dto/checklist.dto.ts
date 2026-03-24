import { createZodDto } from 'nestjs-zod';
import {
  createChecklistSchema,
  updateChecklistSchema,
  addChecklistEntrySchema,
  reorderEntriesSchema,
} from '@figly/shared';

export class CreateChecklistDto extends createZodDto(createChecklistSchema) {}
export class UpdateChecklistDto extends createZodDto(updateChecklistSchema) {}
export class AddChecklistEntryDto extends createZodDto(addChecklistEntrySchema) {}
export class ReorderEntriesDto extends createZodDto(reorderEntriesSchema) {}
