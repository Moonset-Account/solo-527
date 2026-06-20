import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID, IsArray, IsObject, IsInt, Min } from 'class-validator';
import { DeliveryStatus, DeliveryType } from '../../../common/enums/delivery.enum';

export class CreateDeliveryDto {
  @IsUUID()
  orderId: string;

  @IsEnum(DeliveryType)
  @IsOptional()
  type?: DeliveryType;

  @IsString()
  @IsNotEmpty()
  deliveryNote: string;

  @IsArray()
  @IsUUID('4', { each: true })
  itemIds: string[];

  @IsArray()
  @IsOptional()
  attachmentIds?: string[];
}

export class ReviewDeliveryDto {
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;

  @IsString()
  @IsOptional()
  clientFeedback?: string;

  @IsObject()
  @IsOptional()
  revisionRequests?: Record<string, any>[];
}

export class QueryDeliveriesDto {
  @IsUUID()
  @IsOptional()
  orderId?: string;

  @IsEnum(DeliveryStatus)
  @IsOptional()
  status?: DeliveryStatus;

  @IsEnum(DeliveryType)
  @IsOptional()
  type?: DeliveryType;

  @IsInt()
  @Min(1)
  @IsOptional()
  revisionRound?: number;

  @IsString()
  @IsOptional()
  page?: string = '1';

  @IsString()
  @IsOptional()
  pageSize?: string = '20';
}
