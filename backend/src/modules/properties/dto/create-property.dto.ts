import { IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { PropertyType, PropertyStatus } from '../entities/property.entity';

export class CreatePropertyDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsEnum(['private_office', 'hot_desk', 'meeting_room', 'long_term'])
  type: PropertyType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  area?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  capacity?: number;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsOptional()
  @IsString()
  building?: string;

  @IsOptional()
  @IsEnum(['vacant', 'rented', 'maintenance', 'closed'])
  status?: PropertyStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  sourceRemark?: string;
}
