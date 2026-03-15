import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePostDto {
  @IsOptional()
  @IsString({ message: 'Caption phai la chuoi ky tu' })
  @MaxLength(2200, { message: 'Caption toi da 2200 ky tu' })
  caption?: string | null;
}
