import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID, IsNumber, Min, IsDateString } from 'class-validator';
import { ExceptionType, ExceptionStatus, ExceptionPriority, RefundStatus } from '../../../common/enums/exception.enum';

export class CreateExceptionDto {
  @IsUUID()
  orderId: string;

  @IsEnum(ExceptionType)
  type: ExceptionType;

  @IsEnum(ExceptionPriority)
  @IsOptional()
  priority?: ExceptionPriority;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  reporterName?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  refundRequestedAmount?: number;

  @IsString()
  @IsOptional()
  refundReason?: string;

  @IsString()
  @IsOptional()
  refundEvidence?: string;
}

export class AssignExceptionDto {
  @IsUUID()
  handlerId: string;
}

export class UpdateExceptionStatusDto {
  @IsEnum(ExceptionStatus)
  status: ExceptionStatus;

  @IsString()
  @IsOptional()
  note?: string;
}

export class SubmitConclusionDto {
  @IsString()
  @IsNotEmpty()
  handlerConclusion: string;

  @IsString()
  @IsOptional()
  processingNotes?: string;
}

export class CloseExceptionDto {
  @IsString()
  @IsNotEmpty()
  closingExplanation: string;

  @IsEnum(RefundStatus)
  @IsOptional()
  refundStatus?: RefundStatus;

  @IsNumber()
  @Min(0)
  @IsOptional()
  refundApprovedAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  refundActualAmount?: number;
}

export class UpdateRefundDto {
  @IsEnum(RefundStatus)
  refundStatus: RefundStatus;

  @IsNumber()
  @Min(0)
  @IsOptional()
  refundRequestedAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  refundApprovedAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  refundActualAmount?: number;

  @IsString()
  @IsOptional()
  refundReason?: string;

  @IsString()
  @IsOptional()
  refundEvidence?: string;
}

export class QueryExceptionsDto {
  @IsEnum(ExceptionType)
  @IsOptional()
  type?: ExceptionType;

  @IsEnum(ExceptionStatus)
  @IsOptional()
  status?: ExceptionStatus;

  @IsEnum(ExceptionPriority)
  @IsOptional()
  priority?: ExceptionPriority;

  @IsEnum(RefundStatus)
  @IsOptional()
  refundStatus?: RefundStatus;

  @IsUUID()
  @IsOptional()
  orderId?: string;

  @IsUUID()
  @IsOptional()
  handlerId?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  keyword?: string;

  @IsString()
  @IsOptional()
  page?: string = '1';

  @IsString()
  @IsOptional()
  pageSize?: string = '20';
}
