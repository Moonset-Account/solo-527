import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  IsObject,
} from 'class-validator';
import {
  AnomalySeverity,
  AnomalyStatus,
  AnomalyCategory,
  TrendPoint,
  AnomalyCause,
} from '../schemas/anomaly.schema';

export class CreateAnomalyDto {
  @IsString()
  title: string;

  @IsEnum(['user_growth', 'retention', 'conversion', 'activation', 'revenue', 'other'])
  category: AnomalyCategory;

  @IsString()
  metricName: string;

  @IsOptional()
  @IsEnum(['critical', 'warning', 'info'])
  severity?: AnomalySeverity;

  @IsNumber()
  currentValue: number;

  @IsOptional()
  @IsNumber()
  expectedValue?: number;

  @IsOptional()
  @IsNumber()
  deviationPercent?: number;

  @IsOptional()
  @IsDateString()
  detectedAt?: string;

  @IsOptional()
  @IsArray()
  trendData?: TrendPoint[];

  @IsOptional()
  @IsArray()
  possibleCauses?: AnomalyCause[];

  @IsOptional()
  @IsString()
  datasetId?: string;

  @IsOptional()
  @IsString()
  datasetName?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];
}

export class UpdateAnomalyDto {
  @IsOptional()
  @IsEnum(['pending', 'processing', 'resolved', 'ignored'])
  status?: AnomalyStatus;

  @IsOptional()
  @IsEnum(['critical', 'warning', 'info'])
  severity?: AnomalySeverity;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  resolvedCause?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];
}

export class QueryAnomaliesDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(['user_growth', 'retention', 'conversion', 'activation', 'revenue', 'other'])
  category?: AnomalyCategory;

  @IsOptional()
  @IsEnum(['critical', 'warning', 'info'])
  severity?: AnomalySeverity;

  @IsOptional()
  @IsEnum(['pending', 'processing', 'resolved', 'ignored'])
  status?: AnomalyStatus;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  datasetId?: string;

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

export class BatchAssignDto {
  @IsArray()
  ids: string[];

  @IsString()
  assigneeId: string;
}
