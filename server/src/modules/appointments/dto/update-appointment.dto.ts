import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { AppointmentType, AppointmentStatus } from '../../../schemas/appointment.schema';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';

export class UpdateAppointmentDto {
  @ApiProperty({ description: '关联线索ID', required: false })
  @IsOptional()
  leadId?: Types.ObjectId;

  @ApiProperty({ description: '关联车辆ID', required: false })
  @IsOptional()
  vehicleId?: Types.ObjectId;

  @ApiProperty({ description: '客户姓名', required: false })
  @IsOptional()
  customerName?: string;

  @ApiProperty({ description: '联系电话', required: false })
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: '预约类型', enum: AppointmentType, required: false })
  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @ApiProperty({ description: '状态', enum: AppointmentStatus, required: false })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiProperty({ description: '预约日期', required: false })
  @IsOptional()
  @Type(() => Date)
  scheduledDate?: Date;

  @ApiProperty({ description: '检测模板ID', required: false })
  @IsOptional()
  templateId?: Types.ObjectId;
}
