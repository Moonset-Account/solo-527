import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { QualityStatus } from '../../../schemas/quality.schema';

export class TransitionDto {
  @ApiProperty({ description: '目标状态', enum: QualityStatus })
  @IsNotEmpty()
  @IsEnum(QualityStatus)
  toStatus: QualityStatus;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  remark?: string;
}
