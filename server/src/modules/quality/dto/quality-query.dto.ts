import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { QualityStatus } from '../../../schemas/quality.schema';

export class QualityQueryDto extends PaginationDto {
  @ApiProperty({ description: '状态', enum: QualityStatus, required: false })
  @IsOptional()
  @IsEnum(QualityStatus)
  status?: QualityStatus;

  @ApiProperty({ description: '是否有爽约记录', required: false })
  @IsOptional()
  hasNoShow?: boolean;
}
