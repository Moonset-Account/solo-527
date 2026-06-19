import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ description: '车牌号', example: '京A12345' })
  @IsString()
  @IsNotEmpty({ message: '车牌号不能为空' })
  plateNumber: string;

  @ApiProperty({ description: '品牌', example: '丰田' })
  @IsString()
  @IsNotEmpty({ message: '品牌不能为空' })
  brand: string;

  @ApiProperty({ description: '型号', example: '凯美瑞' })
  @IsString()
  @IsNotEmpty({ message: '型号不能为空' })
  model: string;

  @ApiProperty({ description: '车架号', example: 'LFV2A21K5D4123456', required: false })
  @IsString()
  @IsOptional()
  vin?: string;

  @ApiProperty({ description: '车主姓名', example: '张三' })
  @IsString()
  @IsNotEmpty({ message: '车主姓名不能为空' })
  ownerName: string;

  @ApiProperty({ description: '车主电话', example: '13800138000' })
  @IsString()
  @IsNotEmpty({ message: '车主电话不能为空' })
  ownerPhone: string;

  @ApiProperty({ description: '里程数', example: 50000, required: false })
  @IsNumber()
  @IsOptional()
  mileage?: number;

  @ApiProperty({ description: '上次保养日期', example: '2024-01-15', required: false })
  @IsDateString()
  @IsOptional()
  lastMaintenanceDate?: string;
}
