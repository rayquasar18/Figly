import { IsString, IsUrl } from 'class-validator';

export class SavePushSubscriptionDto {
  @IsUrl()
  endpoint!: string;

  @IsString()
  p256dh!: string;

  @IsString()
  auth!: string;
}

export class RemovePushSubscriptionDto {
  @IsUrl()
  endpoint!: string;
}
