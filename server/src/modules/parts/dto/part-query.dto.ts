import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class PartQueryDto extends PaginationDto {
  @ApiProperty({ description: '搜索关键词（配件编码、名称、品牌、适用车型）', required: false })
  @IsString()
  @IsOptional()
  keyword?: string;
}
