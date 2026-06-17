import { IsBoolean, IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';

export class ReconcileBillDto {
  @IsBoolean()
  reconciled: boolean;

  @IsOptional()
  @IsNumber()
  paidAmount?: number;

  @IsOptional()
  @IsDateString()
  paidDate?: string;

  @IsOptional()
  @IsString()
  sourceRemark?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}
