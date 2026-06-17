import { IsEnum, IsString, IsOptional } from 'class-validator';
import { PropertyStatus } from '../entities/property.entity';

export class UpdatePropertyStatusDto {
  @IsEnum(['vacant', 'rented', 'maintenance', 'closed'])
  status: PropertyStatus;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  sourceRemark?: string;
}
