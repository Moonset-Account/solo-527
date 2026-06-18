import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  IsObject,
} from 'class-validator';
import { Types } from 'mongoose';
import { ReportStatus, ReviewSchedule } from '../schemas/report.schema';

export class CreateReportDto {
  @IsString()
  title: string;

  @IsEnum(['weekly', 'monthly', 'custom'])
  reportType: 'weekly' | 'monthly' | 'custom';

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  highlights?: string;

  @IsOptional()
  @IsString()
  problems?: string;

  @IsOptional()
  @IsString()
  improvements?: string;

  @IsOptional()
  @IsObject()
  schedule?: ReviewSchedule;

  @IsOptional()
  @IsArray()
  tags?: string[];
}

export class UpdateReportDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  highlights?: string;

  @IsOptional()
  @IsString()
  problems?: string;

  @IsOptional()
  @IsString()
  improvements?: string;

  @IsOptional()
  @IsObject()
  schedule?: ReviewSchedule;

  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: ReportStatus;

  @IsOptional()
  @IsArray()
  tags?: string[];
}

export class QueryReportsDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(['weekly', 'monthly', 'custom'])
  reportType?: 'weekly' | 'monthly' | 'custom';

  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: ReportStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  pageSize?: number = 20;
}
