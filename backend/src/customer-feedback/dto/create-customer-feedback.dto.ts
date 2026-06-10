import { IsString, IsOptional, IsNotEmpty, IsNumber, IsEnum } from 'class-validator';
import { FeedbackType } from '../../common/enums/feedback-type.enum';
import { FeedbackStatus } from '../../common/enums/feedback-status.enum';

export class CreateCustomerFeedbackDto {
  @IsNumber()
  projectId: number;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(FeedbackType)
  type: FeedbackType;

  @IsString()
  @IsOptional()
  handler?: string;

  @IsEnum(FeedbackStatus)
  @IsOptional()
  status?: FeedbackStatus;
}
