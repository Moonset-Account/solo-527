import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsNumber, IsUUID, ValidateNested, IsDateString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, SatisfactionLevel, PaymentMethod } from '../../../common/enums/order.enum';
import { LicenseType } from '../../../common/enums/material.enum';

export class OrderItemDto {
  @IsUUID()
  materialId: string;

  @IsEnum(LicenseType)
  @IsOptional()
  licenseType?: LicenseType;

  @IsInt()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class CreateOrderDto {
  @IsUUID()
  photographerId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsInt()
  @IsOptional()
  maxRevisionRounds?: number;

  @IsDateString()
  @IsOptional()
  deadlineAt?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class ConfirmSelectionDto {
  @IsArray()
  @IsUUID('4', { each: true })
  selectedItemIds: string[];
}

export class RecordDownloadDto {
  @IsArray()
  @IsUUID('4', { each: true })
  itemIds: string[];
}

export class SubmitSatisfactionDto {
  @IsEnum(SatisfactionLevel)
  satisfactionLevel: SatisfactionLevel;

  @IsString()
  @IsOptional()
  satisfactionFeedback?: string;
}

export class PaymentDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}

export class QueryOrdersDto {
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsString()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  photographerId?: string;

  @IsString()
  @IsOptional()
  orderNo?: string;

  @IsEnum(SatisfactionLevel)
  @IsOptional()
  satisfactionLevel?: SatisfactionLevel;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  page?: string = '1';

  @IsString()
  @IsOptional()
  pageSize?: string = '20';
}
