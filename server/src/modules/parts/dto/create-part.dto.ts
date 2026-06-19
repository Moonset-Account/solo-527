import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreatePartDto {
  @ApiProperty({ description: '配件编码', example: 'P001' })
  @IsString()
  @IsNotEmpty({ message: '配件编码不能为空' })
  code: string;

  @ApiProperty({ description: '配件名称', example: '机油滤清器' })
  @IsString()
  @IsNotEmpty({ message: '配件名称不能为空' })
  name: string;

  @ApiProperty({ description: '品牌', example: '博世' })
  @IsString()
  @IsNotEmpty({ message: '品牌不能为空' })
  brand: string;

  @ApiProperty({ description: '适用车型', example: '丰田凯美瑞' })
  @IsString()
  @IsNotEmpty({ message: '适用车型不能为空' })
  model: string;

  @ApiProperty({ description: '价格', example: 50 })
  @IsNumber()
  @IsNotEmpty({ message: '价格不能为空' })
  price: number;

  @ApiProperty({ description: '库存数量', example: 100, required: false })
  @IsNumber()
  @IsOptional()
  stock?: number;

  @ApiProperty({ description: '单位', example: '个' })
  @IsString()
  @IsNotEmpty({ message: '单位不能为空' })
  unit: string;
}
