import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class ToggleRuleDto {
  @ApiProperty({ description: '生效时间', example: '2024-01-01T00:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  effectiveTime?: string;
}
