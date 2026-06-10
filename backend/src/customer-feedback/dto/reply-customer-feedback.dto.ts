import { IsString, IsOptional } from 'class-validator';

export class ReplyCustomerFeedbackDto {
  @IsString()
  reply: string;

  @IsString()
  @IsOptional()
  handler?: string;
}
