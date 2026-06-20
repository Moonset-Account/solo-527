import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  activityId: string;

  @IsString()
  @IsNotEmpty()
  reporterId: string;

  @IsString()
  @IsNotEmpty()
  reporterName: string;

  @IsString()
  @IsNotEmpty()
  targetId: string;

  @IsString()
  @IsNotEmpty()
  targetName: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class UpdateReportDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  resolvedBy?: string;
}

export class QueryReportDto {
  @IsString()
  @IsOptional()
  activityId?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  reporterId?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}
