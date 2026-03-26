import { createZodDto } from 'nestjs-zod';
import { createPostSchema } from '@figly/shared';

export class CreatePostDto extends createZodDto(createPostSchema) {}
