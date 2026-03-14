import {
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreatePostDto {
  @IsArray({ message: 'mediaIds phai la mang' })
  @ArrayMinSize(1, { message: 'Can it nhat 1 hinh anh' })
  @ArrayMaxSize(10, { message: 'Toi da 10 hinh anh' })
  @IsString({ each: true, message: 'Moi mediaId phai la chuoi ky tu' })
  mediaIds: string[];

  @IsOptional()
  @IsString({ message: 'Caption phai la chuoi ky tu' })
  @MaxLength(2200, { message: 'Caption toi da 2200 ky tu' })
  caption?: string | null;
}
