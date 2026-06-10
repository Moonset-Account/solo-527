import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { AfterSalesStatus } from '../../common/enums/after-sales-status.enum';

export class ProcessAfterSalesDto {
  @IsString()
  solution: string;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsString()
  @IsOptional()
  handler?: string;

  @IsEnum(AfterSalesStatus)
  @IsOptional()
  status?: AfterSalesStatus;
}
