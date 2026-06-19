import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class TemplateItemDto {
  @ApiProperty({ description: '检测项名称', example: '机油液位' })
  @IsString()
  @IsNotEmpty({ message: '检测项名称不能为空' })
  name: string;

  @ApiProperty({ description: '检测标准', example: '在MIN和MAX之间' })
  @IsString()
  @IsNotEmpty({ message: '检测标准不能为空' })
  standard: string;

  @ApiProperty({ description: '单位', example: 'L', required: false })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ description: '最小值', example: 4, required: false })
  @IsNumber()
  @IsOptional()
  minValue?: number;

  @ApiProperty({ description: '最大值', example: 6, required: false })
  @IsNumber()
  @IsOptional()
  maxValue?: number;
}

export class CreateTemplateDto {
  @ApiProperty({ description: '模板名称', example: '常规保养检测' })
  @IsString()
  @IsNotEmpty({ message: '模板名称不能为空' })
  name: string;

  @ApiProperty({ description: '分类', example: '保养' })
  @IsString()
  @IsNotEmpty({ message: '分类不能为空' })
  category: string;

  @ApiProperty({ description: '检测项列表', type: [TemplateItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateItemDto)
  items: TemplateItemDto[];

  @ApiProperty({ description: '是否启用', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
