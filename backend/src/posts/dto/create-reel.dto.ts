import { createZodDto } from 'nestjs-zod';
import { createReelSchema } from '@figly/shared';
import { z } from 'zod';

// Extend shared schema with backend-specific video metadata fields
const backendCreateReelSchema = createReelSchema.extend({
  duration: z.number().min(0),
  width: z.number().min(1),
  height: z.number().min(1),
});

export class CreateReelDto extends createZodDto(backendCreateReelSchema) {}
