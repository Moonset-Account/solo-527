import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LeadIntention, LeadStatus } from '../../../schemas/lead.schema';
import { Types } from 'mongoose';

export class UpdateLeadDto {
  @ApiProperty({ description: '客户姓名', required: false })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({ description: '联系电话', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: '线索来源', required: false })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty({ description: '意向度', enum: LeadIntention, required: false })
  @IsOptional()
  @IsEnum(LeadIntention)
  intention?: LeadIntention;

  @ApiProperty({ description: '状态', enum: LeadStatus, required: false })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiProperty({ description: '关联车辆ID', required: false })
  @IsOptional()
  vehicleId?: Types.ObjectId;
}
