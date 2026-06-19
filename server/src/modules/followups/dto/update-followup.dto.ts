import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { FollowupType, FollowupStatus } from '../../../schemas/followup.schema';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';

export class UpdateFollowupDto {
  @ApiProperty({ description: '关联线索ID', required: false })
  @IsOptional()
  leadId?: Types.ObjectId;

  @ApiProperty({ description: '关联车辆ID', required: false })
  @IsOptional()
  vehicleId?: Types.ObjectId;

  @ApiProperty({ description: '联系人姓名', required: false })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiProperty({ description: '联系电话', required: false })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiProperty({ description: '回访类型', enum: FollowupType, required: false })
  @IsOptional()
  @IsEnum(FollowupType)
  type?: FollowupType;

  @ApiProperty({ description: '状态', enum: FollowupStatus, required: false })
  @IsOptional()
  @IsEnum(FollowupStatus)
  status?: FollowupStatus;

  @ApiProperty({ description: '计划回访时间', required: false })
  @IsOptional()
  @Type(() => Date)
  scheduledAt?: Date;

  @ApiProperty({ description: '负责人ID', required: false })
  @IsOptional()
  assigneeId?: Types.ObjectId;

  @ApiProperty({ description: '回访结果', required: false })
  @IsOptional()
  @IsString()
  result?: string;

  @ApiProperty({ description: '是否已预约', required: false })
  @IsOptional()
  @IsBoolean()
  appointmentMade?: boolean;
}
