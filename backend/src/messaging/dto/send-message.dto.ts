import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ArrayMaxSize,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'contentOrMedia', async: false })
class ContentOrMediaConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments) {
    const obj = args.object as SendMessageDto;
    return !!(obj.content || (obj.mediaIds && obj.mediaIds.length > 0));
  }

  defaultMessage() {
    return 'Tin nhan can co noi dung hoac media';
  }
}

export class SendMessageDto {
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  content?: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  @IsOptional()
  @Validate(ContentOrMediaConstraint)
  mediaIds?: string[];
}
