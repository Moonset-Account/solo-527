import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID, IsObject } from 'class-validator';
import { TimelineEventType } from '../../../common/enums/timeline.enum';

export class CreateTimelineDto {
  @IsUUID()
  orderId: string;

  @IsEnum(TimelineEventType)
  @IsOptional()
  eventType?: TimelineEventType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  operatorId?: string;

  @IsString()
  @IsOptional()
  operatorName?: string;

  @IsString()
  @IsOptional()
  operatorRole?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsUUID()
  @IsOptional()
  relatedEntityId?: string;

  @IsString()
  @IsOptional()
  relatedEntityType?: string;
}

export class QueryTimelinesDto {
  @IsUUID()
  @IsOptional()
  orderId?: string;

  @IsEnum(TimelineEventType)
  @IsOptional()
  eventType?: TimelineEventType;

  @IsUUID()
  @IsOptional()
  operatorId?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;
}
