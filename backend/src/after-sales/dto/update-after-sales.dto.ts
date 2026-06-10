import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { AfterSalesType } from '../../common/enums/after-sales-type.enum';
import { AfterSalesStatus } from '../../common/enums/after-sales-status.enum';

export class UpdateAfterSalesDto {
  @IsNumber()
  @IsOptional()
  projectId?: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  reporter?: string;

  @IsEnum(AfterSalesType)
  @IsOptional()
  type?: AfterSalesType;

  @IsString()
  @IsOptional()
  handler?: string;

  @IsString()
  @IsOptional()
  solution?: string;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsEnum(AfterSalesStatus)
  @IsOptional()
  status?: AfterSalesStatus;
}
