import { IsString, IsEnum, IsOptional, IsDateString, IsNotEmpty } from 'class-validator';
import { ExceptionType, ExceptionSeverity, ExceptionStatus } from '../access-exception.schema';
import { ConfigStatus } from '../../common/decorators/config-status.enum';

export class CreateAccessExceptionDto {
  @IsEnum(ExceptionType) type: ExceptionType;
  @IsEnum(ExceptionSeverity) @IsOptional() severity?: ExceptionSeverity;
  @IsDateString() occurrenceTime: string;
  @IsString() location: string;
  @IsString() @IsOptional() deviceId?: string;
  @IsString() @IsOptional() personName?: string;
  @IsString() @IsOptional() personCardNo?: string;
  @IsString() @IsNotEmpty() impactScope: string;
  @IsString() @IsNotEmpty() description: string;
  @IsString() @IsOptional() currentOwner?: string;
}

export class UpdateAccessExceptionDto {
  @IsEnum(ExceptionType) @IsOptional() type?: ExceptionType;
  @IsEnum(ExceptionSeverity) @IsOptional() severity?: ExceptionSeverity;
  @IsEnum(ExceptionStatus) @IsOptional() status?: ExceptionStatus;
  @IsDateString() @IsOptional() occurrenceTime?: string;
  @IsString() @IsOptional() location?: string;
  @IsString() @IsOptional() impactScope?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() currentOwner?: string;
  @IsString() @IsOptional() processContent?: string;
  @IsString() @IsOptional() resolution?: string;
  @IsEnum(ConfigStatus) @IsOptional() configStatus?: ConfigStatus;
}
