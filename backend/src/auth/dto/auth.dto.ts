import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: 'Email khong hop le' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Mat khau phai co it nhat 8 ky tu' })
  @Matches(/[a-zA-Z]/, { message: 'Mat khau phai chua chu cai' })
  @Matches(/[0-9]/, { message: 'Mat khau phai chua so' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Ten khong duoc de trong' })
  name: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Email khong hop le' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Mat khau khong duoc de trong' })
  password: string;
}

export class ResetPasswordRequestDto {
  @IsEmail({}, { message: 'Email khong hop le' })
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(8, { message: 'Mat khau phai co it nhat 8 ky tu' })
  @Matches(/[a-zA-Z]/, { message: 'Mat khau phai chua chu cai' })
  @Matches(/[0-9]/, { message: 'Mat khau phai chua so' })
  newPassword: string;
}

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
