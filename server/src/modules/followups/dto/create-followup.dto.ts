import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
import { FollowupType } from '../../../schemas/followup.schema';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';

export class CreateFollowupDto {
  @ApiProperty({ description: '关联线索ID' })
  @IsNotEmpty()
  leadId: Types.ObjectId;

  @ApiProperty({ description: '关联车辆ID', required: false })
  @IsOptional()
  vehicleId?: Types.ObjectId;

  @ApiProperty({ description: '联系人姓名' })
  @IsNotEmpty()
  @IsString()
  contactName: string;

  @ApiProperty({ description: '联系电话' })
  @IsNotEmpty()
  @IsString()
  contactPhone: string;

  @ApiProperty({ description: '回访类型', enum: FollowupType })
  @IsNotEmpty()
  @IsEnum(FollowupType)
  type: FollowupType;

  @ApiProperty({ description: '计划回访时间' })
  @IsNotEmpty()
  @Type(() => Date)
  scheduledAt: Date;

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
