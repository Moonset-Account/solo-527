import { IsString, IsEnum, IsOptional } from 'class-validator';
import { FaultSeverity, FaultStatus, AlertStatus } from '../entities/fault.entity';

export class UpdateFaultDto {
  @IsString()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  reporterName: string;

  @IsEnum(FaultSeverity)
  @IsOptional()
  severity: FaultSeverity;

  @IsEnum(FaultStatus)
  @IsOptional()
  status: FaultStatus;

  @IsString()
  @IsOptional()
  responsiblePerson: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  resolution: string;

  @IsString()
  @IsOptional()
  department: string;

  @IsString()
  @IsOptional()
  systemName: string;

  @IsEnum(AlertStatus)
  @IsOptional()
  alertStatus: AlertStatus;

  @IsString()
  @IsOptional()
  alertLogId: string;

  @IsString()
  @IsOptional()
  reason: string;

  @IsString()
  @IsOptional()
  operatorName: string;
}
