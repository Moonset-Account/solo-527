import { IsString, IsOptional, IsArray, IsEnum, IsBoolean, IsObject } from 'class-validator';
import { NotificationType, NotificationPriority } from '../../../common/enums/index.enum';

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsArray()
  @IsString({ each: true })
  recipientIds: string[];

  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;

  @IsOptional()
  @IsString()
  relatedModule?: string;

  @IsOptional()
  @IsString()
  relatedId?: string;

  @IsOptional()
  @IsBoolean()
  needConfirmation?: boolean;
}

export class QueryNotificationDto {
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  unconfirmedOnly?: boolean;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  pageSize?: number = 20;
}
