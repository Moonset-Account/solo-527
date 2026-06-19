import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean, IsObject } from 'class-validator';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';
import { AppointmentType } from '../../../schemas/appointment.schema';

class AppointmentData {
  @ApiProperty({ description: '车辆ID' })
  @IsNotEmpty()
  vehicleId: Types.ObjectId;

  @ApiProperty({ description: '客户姓名' })
  @IsNotEmpty()
  @IsString()
  customerName: string;

  @ApiProperty({ description: '联系电话' })
  @IsNotEmpty()
  @IsString()
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

export class CompleteFollowupDto {
  @ApiProperty({ description: '回访结果' })
  @IsNotEmpty()
  @IsString()
  result: string;

  @ApiProperty({ description: '是否已预约' })
  @IsNotEmpty()
  @IsBoolean()
  appointmentMade: boolean;

  @ApiProperty({ description: '预约数据，appointmentMade=true 时必填', required: false })
  @IsOptional()
  @IsObject()
  appointmentData?: AppointmentData;
}
