import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: 'Email khong hop le' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Mat khau phai co it nhat 8 ky tu' })
  @Matches(/[a-zA-Z]/, { message: 'Mat khau phai chua chu cai' })
  @Matches(/[0-9]/, { message: 'Mat khau phai chua so' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'Ten khong duoc de trong' })
  name!: string;

  @IsString({ message: 'Ten nguoi dung phai la chuoi ky tu' })
  @MinLength(3, { message: 'Ten nguoi dung phai co it nhat 3 ky tu' })
  @MaxLength(30, { message: 'Ten nguoi dung khong duoc vuot qua 30 ky tu' })
  @Matches(/^[a-z0-9_.]+$/, {
    message: 'Ten nguoi dung chi chua chu thuong, so, dau gach duoi va dau cham',
  })
  username!: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Email khong hop le' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Mat khau khong duoc de trong' })
  password!: string;
}

export class ResetPasswordRequestDto {
  @IsEmail({}, { message: 'Email khong hop le' })
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @MinLength(8, { message: 'Mat khau phai co it nhat 8 ky tu' })
  @Matches(/[a-zA-Z]/, { message: 'Mat khau phai chua chu cai' })
  @Matches(/[0-9]/, { message: 'Mat khau phai chua so' })
  newPassword!: string;
}

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}
