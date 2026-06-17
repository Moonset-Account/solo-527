import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { MaintenancePriority, MaintenanceStatus } from '../maintenance.schema';
import { ConfigStatus } from '../../common/decorators/config-status.enum';

export class CreateMaintenanceDto {
  @IsString() title: string;
  @IsString() description: string;
  @IsString() location: string;
  @IsEnum(MaintenancePriority) priority: MaintenancePriority;
  @IsString() @IsOptional() reporterName?: string;
  @IsString() @IsOptional() reporterPhone?: string;
}

export class UpdateMaintenanceDto {
  @IsString() @IsOptional() title?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() location?: string;
  @IsEnum(MaintenancePriority) @IsOptional() priority?: MaintenancePriority;
  @IsEnum(MaintenanceStatus) @IsOptional() status?: MaintenanceStatus;
  @IsString() @IsOptional() assignee?: string;
  @IsEnum(ConfigStatus) @IsOptional() configStatus?: ConfigStatus;
  @IsString() @IsOptional() handleContent?: string;
}
