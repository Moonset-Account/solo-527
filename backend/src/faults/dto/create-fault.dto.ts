import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { FaultSeverity } from '../entities/fault.entity';

export class CreateFaultDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  reporterName: string;

  @IsEnum(FaultSeverity)
  @IsOptional()
  severity: FaultSeverity;

  @IsString()
  @IsOptional()
  responsiblePerson: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  department: string;

  @IsString()
  @IsOptional()
  systemName: string;
}
