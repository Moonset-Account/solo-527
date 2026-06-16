import { IsString, IsOptional, IsEnum } from 'class-validator';

export class MessageResultDto {
  @IsEnum(['sent', 'failed'])
  status: 'sent' | 'failed';

  @IsOptional()
  @IsString()
  providerMessageId?: string;

  @IsOptional()
  @IsString()
  errorMessage?: string;
}
