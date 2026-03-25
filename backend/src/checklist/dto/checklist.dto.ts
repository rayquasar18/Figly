import { IsString, IsOptional, IsBoolean, IsArray, MaxLength } from 'class-validator';

export class CreateChecklistDto {
  @IsString({ message: 'Ten checklist phai la chuoi ky tu' })
  @MaxLength(100, { message: 'Ten checklist toi da 100 ky tu' })
  name!: string;

  @IsOptional()
  @IsBoolean({ message: 'isPublic phai la boolean' })
  isPublic?: boolean;
}

export class UpdateChecklistDto {
  @IsOptional()
  @IsString({ message: 'Ten checklist phai la chuoi ky tu' })
  @MaxLength(100, { message: 'Ten checklist toi da 100 ky tu' })
  name?: string;

  @IsOptional()
  @IsBoolean({ message: 'isPublic phai la boolean' })
  isPublic?: boolean;
}

export class AddChecklistEntryDto {
  @IsOptional()
  @IsString({ message: 'itemId phai la chuoi ky tu' })
  itemId?: string;

  @IsOptional()
  @IsString({ message: 'Noi dung phai la chuoi ky tu' })
  @MaxLength(200, { message: 'Noi dung toi da 200 ky tu' })
  freeformText?: string;
}

export class ReorderEntriesDto {
  @IsArray({ message: 'entryIds phai la mang' })
  @IsString({ each: true, message: 'Moi entryId phai la chuoi ky tu' })
  entryIds!: string[];
}
