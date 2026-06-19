import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class VehicleQueryDto extends PaginationDto {
  @ApiProperty({ description: '搜索关键词（车牌号、车主姓名、品牌、型号）', required: false })
  @IsString()
  @IsOptional()
  keyword?: string;
}
