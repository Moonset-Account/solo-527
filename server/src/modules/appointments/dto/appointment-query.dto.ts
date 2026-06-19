import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AppointmentType, AppointmentStatus } from '../../../schemas/appointment.schema';
import { Type } from 'class-transformer';

export class AppointmentQueryDto extends PaginationDto {
  @ApiProperty({ description: '客户姓名', required: false })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({ description: '联系电话', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: '预约类型', enum: AppointmentType, required: false })
  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @ApiProperty({ description: '状态', enum: AppointmentStatus, required: false })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiProperty({ description: '预约开始日期', required: false })
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @ApiProperty({ description: '预约结束日期', required: false })
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;
}
