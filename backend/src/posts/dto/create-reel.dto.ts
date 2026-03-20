import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsArray,
  IsNumber,
  Min,
} from 'class-validator';
import { REEL_LIMITS } from '@figly/shared';

export class CreateReelDto {
  @IsString()
  @IsNotEmpty({ message: 'Media ID khong duoc de trong' })
  mediaId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(REEL_LIMITS.maxCaptionLength, {
    message: `Chu thich khong duoc vuot qua ${REEL_LIMITS.maxCaptionLength} ky tu`,
  })
  caption?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  linkedItemIds?: string[];

  @IsNumber()
  @Min(0)
  duration!: number;

  @IsNumber()
  @Min(1)
  width!: number;

  @IsNumber()
  @Min(1)
  height!: number;
}
