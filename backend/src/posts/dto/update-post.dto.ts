import { createZodDto } from 'nestjs-zod';
import { updateCaptionSchema } from '@figly/shared';

export class UpdatePostDto extends createZodDto(updateCaptionSchema) {}
