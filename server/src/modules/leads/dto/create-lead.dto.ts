import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LeadIntention } from '../../../schemas/lead.schema';
import { Types } from 'mongoose';

export class CreateLeadDto {
  @ApiProperty({ description: '客户姓名' })
  @IsNotEmpty()
  @IsString()
  customerName: string;

  @ApiProperty({ description: '联系电话' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ description: '线索来源' })
  @IsNotEmpty()
  @IsString()
  source: string;

  @ApiProperty({ description: '意向度', enum: LeadIntention })
  @IsNotEmpty()
  @IsEnum(LeadIntention)
  intention: LeadIntention;

  @ApiProperty({ description: '关联车辆ID', required: false })
  @IsOptional()
  vehicleId?: Types.ObjectId;
}
