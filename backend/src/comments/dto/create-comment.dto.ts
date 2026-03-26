import { createZodDto } from 'nestjs-zod';
import { createCommentSchema } from '@figly/shared';

export class CreateCommentDto extends createZodDto(createCommentSchema) {}
