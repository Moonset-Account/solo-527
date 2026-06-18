import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';
import {
  DatasetStatus,
  PermissionLevel,
  DatasetPermission,
  DatasetMetric,
} from '../schemas/dataset.schema';

class MetricDto implements DatasetMetric {
  @IsString()
  name: string;

  @IsString()
  displayName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  unit?: string;
}

class PermissionDto {
  @IsString()
  userId: string | Types.ObjectId;

  userName?: string;

  @IsEnum(['read', 'write', 'manage'])
  level: PermissionLevel;

  @IsOptional()
  @IsDateString()
  expireAt?: string;
}

export class CreateDatasetDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MetricDto)
  metrics?: DatasetMetric[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  permissions?: DatasetPermission[];

  @IsOptional()
  @IsString()
  dataSource?: string;
}

export class UpdateDatasetDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MetricDto)
  metrics?: DatasetMetric[];

  @IsOptional()
  @IsEnum(['active', 'archived'])
  status?: DatasetStatus;
}

export class AddPermissionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  permissions: DatasetPermission[];
}

export class UpdatePermissionDto {
  @IsString()
  userId: string;

  @IsEnum(['read', 'write', 'manage'])
  level: PermissionLevel;

  @IsOptional()
  @IsDateString()
  expireAt?: string;
}

export class QueryDatasetsDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(['active', 'archived'])
  status?: DatasetStatus;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  pageSize?: number = 20;
}
