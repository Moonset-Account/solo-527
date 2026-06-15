import { IsEnum, IsDateString, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ChangeWindowEntityType } from '../entities/change-window.entity';

export class CreateChangeWindowDto {
  @IsEnum(ChangeWindowEntityType)
  entityType: ChangeWindowEntityType;

  @IsString()
  @IsNotEmpty()
  entityId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsString()
  @IsOptional()
  approvedBy: string;

  @IsString()
  @IsOptional()
  description: string;
}
