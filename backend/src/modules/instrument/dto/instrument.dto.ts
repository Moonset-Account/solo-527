import { IsString, IsOptional, IsDateString, IsArray, IsEnum, IsBoolean, IsMongoId } from 'class-validator';
import { InstrumentStatus } from '@/common/enums/index.enum';
import { Types } from 'mongoose';

export class CreateInstrumentDto {
  @IsString()
  instrumentNo: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsEnum(InstrumentStatus)
  status?: InstrumentStatus;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  laboratory?: string;

  @IsOptional()
  @IsString()
  managerId?: string;

  @IsOptional()
  @IsDateString()
  nextMaintenanceDate?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class QueryInstrumentDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(InstrumentStatus)
  status?: InstrumentStatus;

  @IsOptional()
  @IsString()
  laboratory?: string;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  pageSize?: number = 20;
}

export class CreateBookingDto {
  @IsString()
  instrumentId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsString()
  purpose: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedApplicationIds?: string[];

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class QueryBookingDto {
  @IsOptional()
  @IsString()
  instrumentId?: string;

  @IsOptional()
  @IsString()
  bookerId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  pageSize?: number = 50;
}
