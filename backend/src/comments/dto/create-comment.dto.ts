import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @IsString({ message: 'Binh luan phai la chuoi ky tu' })
  @MinLength(1, { message: 'Binh luan khong duoc de trong' })
  @MaxLength(1000, { message: 'Binh luan toi da 1000 ky tu' })
  content!: string;

  @IsOptional()
  @IsString({ message: 'parentId phai la chuoi ky tu' })
  parentId?: string | null;
}
