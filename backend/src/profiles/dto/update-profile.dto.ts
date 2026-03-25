import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'Ten hien thi phai la chuoi ky tu' })
  @MinLength(1, { message: 'Ten hien thi phai co it nhat 1 ky tu' })
  @MaxLength(50, { message: 'Ten hien thi khong duoc vuot qua 50 ky tu' })
  displayName?: string;

  @IsOptional()
  @IsString({ message: 'Ten nguoi dung phai la chuoi ky tu' })
  @MinLength(3, { message: 'Ten nguoi dung phai co it nhat 3 ky tu' })
  @MaxLength(30, { message: 'Ten nguoi dung khong duoc vuot qua 30 ky tu' })
  @Matches(/^[a-z0-9_.]+$/, {
    message: 'Ten nguoi dung chi chua chu thuong, so, dau gach duoi va dau cham',
  })
  username?: string;

  @IsOptional()
  @IsString({ message: 'Tieu su phai la chuoi ky tu' })
  @MaxLength(150, { message: 'Tieu su khong duoc vuot qua 150 ky tu' })
  bio?: string;

  @IsOptional()
  @IsString({ message: 'Avatar ID phai la chuoi ky tu' })
  avatarId?: string;
}
