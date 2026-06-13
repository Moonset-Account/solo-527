import { IsString, IsOptional, IsEnum, IsArray, IsDateString, IsInt, Min, IsBoolean } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination';
import { PlatformType } from '@/common/enums';
import { ScheduleStatus } from '../schemas/schedule.schema';

export class QueryPlatformAccountDto extends PaginationDto {
  @IsOptional()
  @IsEnum(PlatformType)
  platform?: PlatformType;

  @IsOptional()
  @IsString()
  operator?: string;

  @IsOptional()
  isActive?: boolean;
}

export class CreatePlatformAccountDto {
  @IsString()
  name: string;

  @IsEnum(PlatformType)
  platform: PlatformType;

  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  followers?: number;

  @IsOptional()
  isActive?: boolean;

  @IsString()
  operator: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdatePlatformAccountDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(PlatformType)
  platform?: PlatformType;

  @IsOptional()
  accountId?: string;

  @IsOptional()
  followers?: number;

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  operator?: string;

  @IsOptional()
  remark?: string;
}

export class QueryMaterialDto extends PaginationDto {
  @IsOptional()
  @IsString()
  interviewee?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsArray()
  keywords?: string[];
}

export class CreateMaterialDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  interviewee?: string;

  @IsOptional()
  @IsDateString()
  interviewDate?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsArray()
  keywords?: string[];

  @IsOptional()
  files?: Array<{ name: string; url: string; type: string; duration?: number }>;

  @IsString()
  uploader: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateMaterialDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  interviewee?: string;

  @IsOptional()
  interviewDate?: string;

  @IsOptional()
  location?: string;

  @IsOptional()
  keywords?: string[];

  @IsOptional()
  files?: Array<{ name: string; url: string; type: string; duration?: number }>;

  @IsOptional()
  remark?: string;
}

export class QueryScheduleDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  publisher?: string;
}

export class CreateScheduleDto {
  @IsOptional()
  @IsString()
  contentId?: string;

  @IsOptional()
  @IsString()
  contentTitle?: string;

  @IsArray()
  platformIds: string[];

  @IsDateString()
  scheduledTime: string;

  @IsOptional()
  @IsString()
  publisher?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateScheduleDto {
  @IsOptional()
  contentId?: string;

  @IsOptional()
  contentTitle?: string;

  @IsOptional()
  platformIds?: string[];

  @IsOptional()
  scheduledTime?: string;

  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;

  @IsOptional()
  publisher?: string;

  @IsOptional()
  remark?: string;
}
