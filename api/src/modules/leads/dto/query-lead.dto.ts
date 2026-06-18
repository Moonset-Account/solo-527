import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryLeadDto {
  @IsEnum(['new', 'contacted', 'measured', 'quoted', 'contracted', 'lost'])
  @IsOptional()
  status?: string;

  @IsEnum(['线上表单', '转介绍', '展会', '电话咨询', '老客户推荐'])
  @IsOptional()
  source?: string;

  @IsString()
  @IsOptional()
  assignedTo?: string;

  @IsString()
  @IsOptional()
  tag?: string;

  @IsString()
  @IsOptional()
  keyword?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}
