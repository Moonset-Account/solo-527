import { IsString, IsOptional, IsArray, IsEnum, IsBoolean, IsObject, IsNumber, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DictionaryType, NotificationType, NotificationPriority, UserRole } from '../../../common/enums/index.enum';

export class DictionaryItemDto {
  @IsString()
  value: string;

  @IsString()
  label: string;

  @IsOptional()
  @IsNumber()
  sort?: number;

  @IsOptional()
  @IsObject()
  extra?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class CreateDictionaryDto {
  @IsEnum(DictionaryType)
  type: DictionaryType;

  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DictionaryItemDto)
  items?: DictionaryItemDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scope?: string[];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateDictionaryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DictionaryItemDto)
  items?: DictionaryItemDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scope?: string[];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

class NotifyChannelDto {
  @IsOptional()
  @IsBoolean()
  inApp?: boolean;

  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @IsOptional()
  @IsBoolean()
  sms?: boolean;

  @IsOptional()
  @IsBoolean()
  wechat?: boolean;
}

export class CreateNotificationConfigDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  targetRoles?: UserRole[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetUserIds?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => NotifyChannelDto)
  channels?: NotifyChannelDto;

  @IsOptional()
  @IsString()
  template?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reminderIntervalMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxReminders?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scope?: string[];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateNotificationConfigDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  targetRoles?: UserRole[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetUserIds?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => NotifyChannelDto)
  channels?: NotifyChannelDto;

  @IsOptional()
  @IsString()
  template?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reminderIntervalMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxReminders?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scope?: string[];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class QueryDictionaryDto {
  @IsOptional()
  @IsEnum(DictionaryType)
  type?: DictionaryType;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  pageSize?: number = 100;
}
