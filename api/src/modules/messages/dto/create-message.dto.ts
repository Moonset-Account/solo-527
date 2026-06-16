import { IsNumber, IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @IsNumber()
  userId: number;

  @IsEnum(['sms', 'email', 'wechat', 'push'])
  type: 'sms' | 'email' | 'wechat' | 'push';

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  provider?: string;
}
