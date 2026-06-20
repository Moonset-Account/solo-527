import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRefundDto {
  @IsString()
  @IsNotEmpty()
  registrationId: string;

  @IsString()
  @IsNotEmpty()
  activityId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  userName: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class UpdateRefundDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  reviewedBy?: string;
}

export class QueryRefundDto {
  @IsString()
  @IsOptional()
  activityId?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}
