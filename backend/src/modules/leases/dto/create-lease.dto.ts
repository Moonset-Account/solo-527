import { IsString, IsDateString, IsNumber, IsOptional, Min, IsEnum } from 'class-validator';
import { LeaseStatus } from '../entities/lease.entity';

export class CreateLeaseDto {
  @IsString()
  leaseNo: string;

  @IsString()
  propertyId: string;

  @IsString()
  tenantName: string;

  @IsOptional()
  @IsString()
  tenantContact?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber()
  @Min(0)
  monthlyRent: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  @IsOptional()
  @IsEnum(['active', 'expired', 'terminated'])
  status?: LeaseStatus;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  sourceRemark?: string;
}
