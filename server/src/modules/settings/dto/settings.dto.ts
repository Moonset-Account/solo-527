import { IsString, IsOptional, IsInt, IsBoolean, Min } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryDictItemDto extends PaginationDto {
  @IsOptional()
  @IsString()
  dictCode?: string;

  @IsOptional()
  enabled?: boolean;
}

export class CreateDictItemDto {
  @IsString()
  dictCode: string;

  @IsString()
  dictName: string;

  @IsString()
  itemValue: string;

  @IsString()
  itemLabel: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateDictItemDto {
  @IsOptional()
  @IsString()
  dictCode?: string;

  @IsOptional()
  @IsString()
  dictName?: string;

  @IsOptional()
  @IsString()
  itemValue?: string;

  @IsOptional()
  @IsString()
  itemLabel?: string;

  @IsOptional()
  sort?: number;

  @IsOptional()
  enabled?: boolean;

  @IsOptional()
  remark?: string;
}

export class QuerySystemConfigDto extends PaginationDto {
  @IsOptional()
  @IsString()
  configGroup?: string;
}

export class CreateSystemConfigDto {
  @IsString()
  configKey: string;

  @IsString()
  configValue: string;

  @IsOptional()
  @IsString()
  valueType?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  configGroup: string;
}

export class UpdateSystemConfigDto {
  @IsOptional()
  configValue?: string;

  @IsOptional()
  valueType?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  configGroup?: string;
}
