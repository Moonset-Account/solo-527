import { IsNumber, IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateExceptionDto {
  @IsOptional()
  @IsString()
  sourceType?: string;

  @IsOptional()
  @IsNumber()
  sourceId?: number;

  @IsOptional()
  @IsNumber()
  roomId?: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  severity?: 'low' | 'medium' | 'high' | 'critical';
}
