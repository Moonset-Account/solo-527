import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { AppointmentType } from '../../../schemas/appointment.schema';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';

export class CreateAppointmentDto {
  @ApiProperty({ description: '关联线索ID', required: false })
  @IsOptional()
  leadId?: Types.ObjectId;

  @ApiProperty({ description: '关联车辆ID' })
  @IsNotEmpty()
  vehicleId: Types.ObjectId;

  @ApiProperty({ description: '客户姓名' })
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({ description: '联系电话' })
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: '预约类型', enum: AppointmentType })
  @IsNotEmpty()
  @IsEnum(AppointmentType)
  type: AppointmentType;

  @ApiProperty({ description: '预约日期' })
  @IsNotEmpty()
  @Type(() => Date)
  scheduledDate: Date;

  @ApiProperty({ description: '检测模板ID', required: false })
  @IsOptional()
  templateId?: Types.ObjectId;
}
