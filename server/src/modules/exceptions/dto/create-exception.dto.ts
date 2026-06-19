import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ExceptionSourceType, ExceptionType, ExceptionLevel } from '../../../schemas/exception.schema';
import { Types } from 'mongoose';

export class CreateExceptionDto {
  @ApiProperty({ description: '来源类型', enum: ExceptionSourceType })
  @IsNotEmpty()
  @IsEnum(ExceptionSourceType)
  sourceType: ExceptionSourceType;

  @ApiProperty({ description: '来源ID' })
  @IsNotEmpty()
  sourceId: Types.ObjectId;

  @ApiProperty({ description: '来源编号' })
  @IsNotEmpty()
  @IsString()
  sourceNo: string;

  @ApiProperty({ description: '异常类型', enum: ExceptionType })
  @IsNotEmpty()
  @IsEnum(ExceptionType)
  type: ExceptionType;

  @ApiProperty({ description: '异常描述' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: '严重程度', enum: ExceptionLevel, required: false })
  @IsOptional()
  @IsEnum(ExceptionLevel)
  level?: ExceptionLevel;

  @ApiProperty({ description: '负责人ID', required: false })
  @IsOptional()
  assigneeId?: Types.ObjectId;
}
