import { IsString, IsOptional, IsEnum } from 'class-validator';
import { FeedbackType } from '../../common/enums/feedback-type.enum';
import { FeedbackStatus } from '../../common/enums/feedback-status.enum';

export class UpdateCustomerFeedbackDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsEnum(FeedbackType)
  @IsOptional()
  type?: FeedbackType;

  @IsString()
  @IsOptional()
  handler?: string;

  @IsString()
  @IsOptional()
  reply?: string;

  @IsEnum(FeedbackStatus)
  @IsOptional()
  status?: FeedbackStatus;
}
