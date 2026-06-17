import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { RoomStatus, RoomType } from '../room-pricing.schema';
import { ConfigStatus } from '../../common/decorators/config-status.enum';

export class CreateRoomPricingDto {
  @IsString() roomNo: string;
  @IsEnum(RoomType) roomType: RoomType;
  @IsNumber() floor: number;
  @IsNumber() @Min(0) area: number;
  @IsEnum(RoomStatus) @IsOptional() status?: RoomStatus;
  @IsNumber() @Min(0) monthlyRent: number;
  @IsNumber() @Min(0) @IsOptional() deposit?: number;
  @IsNumber() @Min(0) @IsOptional() waterRate?: number;
  @IsNumber() @Min(0) @IsOptional() electricityRate?: number;
  @IsNumber() @Min(0) @IsOptional() managementFee?: number;
  @IsString() @IsOptional() description?: string;
}

export class UpdateRoomPricingDto {
  @IsEnum(RoomType) @IsOptional() roomType?: RoomType;
  @IsNumber() @IsOptional() floor?: number;
  @IsNumber() @IsOptional() area?: number;
  @IsEnum(RoomStatus) @IsOptional() status?: RoomStatus;
  @IsNumber() @Min(0) @IsOptional() monthlyRent?: number;
  @IsNumber() @Min(0) @IsOptional() deposit?: number;
  @IsNumber() @Min(0) @IsOptional() waterRate?: number;
  @IsNumber() @Min(0) @IsOptional() electricityRate?: number;
  @IsNumber() @Min(0) @IsOptional() managementFee?: number;
  @IsString() @IsOptional() description?: string;
  @IsEnum(ConfigStatus) @IsOptional() configStatus?: ConfigStatus;
}
