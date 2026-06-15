import { IsEnum, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { RecordEntityType } from '../entities/processing-record.entity';

export class CreateRecordDto {
  @IsEnum(RecordEntityType)
  entityType: RecordEntityType;

  @IsString()
  @IsNotEmpty()
  entityId: string;

  @IsString()
  @IsNotEmpty()
  action: string;

  @IsOptional()
  @IsString()
  operator?: string;

  @IsString()
  @IsNotEmpty()
  operatorName: string;

  @IsOptional()
  details?: any;

  @IsOptional()
  previousValue?: any;

  @IsOptional()
  newValue?: any;
}
