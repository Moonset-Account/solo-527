import { IsString, IsEnum, IsOptional } from 'class-validator';
import { PropertyStatus } from '../../properties/entities/property.entity';

export class CreateRoomStatusLogDto {
  @IsString()
  propertyId: string;

  @IsEnum(['vacant', 'rented', 'maintenance', 'closed'])
  fromStatus: PropertyStatus;

  @IsEnum(['vacant', 'rented', 'maintenance', 'closed'])
  toStatus: PropertyStatus;

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
