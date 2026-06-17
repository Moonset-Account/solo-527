import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ReconcileBillDto {
  @IsBoolean()
  reconciled: boolean;

  @IsOptional()
  @IsString()
  remark?: string;
}
