import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ExceptionSourceType, ExceptionType, ExceptionLevel, ExceptionStatus } from '../../../schemas/exception.schema';

export class ExceptionQueryDto extends PaginationDto {
  @ApiProperty({ description: '来源类型', enum: ExceptionSourceType, required: false })
  @IsOptional()
  @IsEnum(ExceptionSourceType)
  sourceType?: ExceptionSourceType;

  @ApiProperty({ description: '异常类型', enum: ExceptionType, required: false })
  @IsOptional()
  @IsEnum(ExceptionType)
  type?: ExceptionType;

  @ApiProperty({ description: '严重程度', enum: ExceptionLevel, required: false })
  @IsOptional()
  @IsEnum(ExceptionLevel)
  level?: ExceptionLevel;

  @ApiProperty({ description: '状态', enum: ExceptionStatus, required: false })
  @IsOptional()
  @IsEnum(ExceptionStatus)
  status?: ExceptionStatus;

  @ApiProperty({ description: '负责人ID', required: false })
  @IsOptional()
  assigneeId?: string;
}
