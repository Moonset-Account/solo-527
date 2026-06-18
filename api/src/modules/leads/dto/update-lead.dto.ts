import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class MeasurementInfoDto {
  @IsOptional()
  measuredAt?: Date;

  @IsString()
  @IsOptional()
  measurer?: string;

  @IsNumber()
  @IsOptional()
  actualArea?: number;

  @IsString()
  @IsOptional()
  structureNote?: string;

  @IsArray()
  @IsOptional()
  photos?: string[];
}

class DecorationDemandDto {
  @IsString()
  @IsOptional()
  houseType?: string;

  @IsNumber()
  @IsOptional()
  area?: number;

  @IsString()
  @IsOptional()
  budgetRange?: string;

  @IsString()
  @IsOptional()
  style?: string;

  @IsString()
  @IsOptional()
  expectedStartDate?: string;
}

export class UpdateLeadDto {
  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(['线上表单', '转介绍', '展会', '电话咨询', '老客户推荐'])
  @IsOptional()
  source?: string;

  @IsEnum(['new', 'contacted', 'measured', 'quoted', 'contracted', 'lost'])
  @IsOptional()
  status?: string;

  @ValidateNested()
  @Type(() => DecorationDemandDto)
  @IsOptional()
  decorationDemand?: DecorationDemandDto;

  @ValidateNested()
  @Type(() => MeasurementInfoDto)
  @IsOptional()
  measurementInfo?: MeasurementInfoDto;

  @IsString()
  @IsOptional()
  assignedTo?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];
}
