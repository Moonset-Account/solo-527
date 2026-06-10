import { IsString, IsOptional, IsNotEmpty, IsNumber, IsEnum } from 'class-validator';
import { AfterSalesType } from '../../common/enums/after-sales-type.enum';
import { AfterSalesStatus } from '../../common/enums/after-sales-status.enum';

export class CreateAfterSalesDto {
  @IsNumber()
  projectId: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  reporter?: string;

  @IsEnum(AfterSalesType)
  type: AfterSalesType;

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
