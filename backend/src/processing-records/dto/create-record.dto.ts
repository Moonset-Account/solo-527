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

  @IsString()
  @IsNotEmpty()
  operator: string;

  @IsString()
  @IsNotEmpty()
  operatorName: string;

  @IsOptional()
  details: Record<string, any>;

  @IsOptional()
  previousValue: Record<string, any>;

  @IsOptional()
  newValue: Record<string, any>;
}
