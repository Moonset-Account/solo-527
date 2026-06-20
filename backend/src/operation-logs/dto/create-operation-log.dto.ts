import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { OperationType } from '../../common/enums/operation-type.enum';

export class CreateOperationLogDto {
  @IsString()
  userId: string;

  @IsEnum(OperationType)
  operationType: OperationType;

  @IsString()
  module: string;

  @IsString()
  @IsOptional()
  targetId?: string;

  @IsObject()
  @IsOptional()
  details?: Record<string, any>;

  @IsString()
  @IsOptional()
  ip?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;
}
