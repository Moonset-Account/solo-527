import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDateString, IsObject } from 'class-validator';

export class CreateRuleDto {
  @ApiProperty({ description: '规则编码', example: 'RULE_001' })
  @IsString()
  @IsNotEmpty({ message: '规则编码不能为空' })
  code: string;

  @ApiProperty({ description: '规则名称', example: '质保期规则' })
  @IsString()
  @IsNotEmpty({ message: '规则名称不能为空' })
  name: string;

  @ApiProperty({ description: '规则描述', example: '车辆质保期为3年或10万公里', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '分类', example: '质保' })
  @IsString()
  @IsNotEmpty({ message: '分类不能为空' })
  category: string;

  @ApiProperty({ description: '是否启用', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiProperty({ description: '生效时间', example: '2024-01-01T00:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  effectiveTime?: string;

  @ApiProperty({ description: '过期时间', example: '2027-01-01T00:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  expiryTime?: string;

  @ApiProperty({ description: '规则配置', example: { warrantyYears: 3, warrantyMileage: 100000 }, required: false })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;
}
