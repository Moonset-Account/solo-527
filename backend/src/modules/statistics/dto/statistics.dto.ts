import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class StatisticsQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsBoolean()
  includeDemo?: boolean;
}
