import { createZodDto } from 'nestjs-zod';
import { updateProfileSchema } from '@figly/shared';

export class UpdateProfileDto extends createZodDto(updateProfileSchema) {}
