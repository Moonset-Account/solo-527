import { IsString, IsNotEmpty, IsUUID, IsEnum, IsOptional, IsDateString } from 'class-validator';

export class CreateAppointmentSlotDto {
  @IsUUID()
  @IsNotEmpty({ message: '医生ID不能为空' })
  doctorId: string;

  @IsDateString({}, { message: '日期格式不正确' })
  @IsNotEmpty({ message: '日期不能为空' })
  date: string;

  @IsString()
  @IsNotEmpty({ message: '开始时间不能为空' })
  startTime: string;

  @IsString()
  @IsNotEmpty({ message: '结束时间不能为空' })
  endTime: string;

  maxPatients?: number;
}

export class CreateAppointmentDto {
  @IsUUID()
  @IsNotEmpty({ message: '患者ID不能为空' })
  patientId: string;

  @IsUUID()
  @IsNotEmpty({ message: '医生ID不能为空' })
  doctorId: string;

  @IsUUID()
  @IsNotEmpty({ message: '号源ID不能为空' })
  slotId: string;

  @IsString()
  @IsNotEmpty({ message: '主诉不能为空' })
  chiefComplaint: string;

  @IsEnum(['first_visit', 'revisit', 'follow_up', 'emergency'], {
    message: '预约类型不正确',
  })
  @IsOptional()
  appointmentType?: string;

  @IsString()
  @IsOptional()
  source?: string;
}

export class UpdateAppointmentDto {
  @IsString()
  @IsOptional()
  chiefComplaint?: string;

  @IsEnum(['pending', 'confirmed', 'completed', 'cancelled', 'no_show'], {
    message: '状态不正确',
  })
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  cancelReason?: string;
}

export class AppointmentListQueryDto {
  page?: number;
  pageSize?: number;
  doctorId?: string;
  patientId?: string;
  date?: string;
  status?: string;
  appointmentType?: string;
}
