import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

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

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsEnum(['线上表单', '转介绍', '展会', '电话咨询', '老客户推荐'])
  @IsNotEmpty()
  source: string;

  @IsEnum(['new', 'contacted', 'measured', 'quoted', 'contracted', 'lost'])
  @IsOptional()
  status?: string;

  @ValidateNested()
  @Type(() => DecorationDemandDto)
  @IsOptional()
  decorationDemand?: DecorationDemandDto;

  @IsString()
  @IsOptional()
  assignedTo?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];
}
