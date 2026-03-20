import { IsString, IsNotEmpty } from 'class-validator';

export class CreateStoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Media la bat buoc' })
  mediaId!: string;
}
