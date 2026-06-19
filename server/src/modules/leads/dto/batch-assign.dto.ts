import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class BatchAssignLeadDto {
  @ApiProperty({ description: '线索ID列表', type: [String] })
  @IsNotEmpty()
  @IsArray()
  leadIds: Types.ObjectId[];

  @ApiProperty({ description: '顾问ID' })
  @IsNotEmpty()
  assigneeId: Types.ObjectId;

  @ApiProperty({ description: '顾问姓名' })
  @IsNotEmpty()
  @IsString()
  assigneeName: string;
}
