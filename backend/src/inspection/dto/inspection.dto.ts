import { IsString, IsEnum, IsOptional, IsArray, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InspectionStatus } from '../inspection.schema';
import { ConfigStatus } from '../../common/decorators/config-status.enum';

export class CheckItemDto {
  @IsString() item: string;
  @IsString() result: string;
  @IsString() @IsOptional() remark?: string;
}

export class CreateInspectionDto {
  @IsString() title: string;
  @IsString() area: string;
  @IsDateString() scheduledAt: string;
  @IsString() @IsOptional() inspector?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => CheckItemDto) @IsOptional()
  checkItems?: CheckItemDto[];
}

export class UpdateInspectionDto {
  @IsString() @IsOptional() title?: string;
  @IsString() @IsOptional() area?: string;
  @IsDateString() @IsOptional() scheduledAt?: string;
  @IsString() @IsOptional() inspector?: string;
  @IsEnum(InspectionStatus) @IsOptional() status?: InspectionStatus;
  @IsArray() @ValidateNested({ each: true }) @Type(() => CheckItemDto) @IsOptional()
  checkItems?: CheckItemDto[];
  @IsString() @IsOptional() conclusion?: string;
  @IsEnum(ConfigStatus) @IsOptional() configStatus?: ConfigStatus;
}
