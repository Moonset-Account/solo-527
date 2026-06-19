import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class AssignLeadDto {
  @ApiProperty({ description: '顾问ID' })
  @IsNotEmpty()
  assigneeId: Types.ObjectId;

  @ApiProperty({ description: '顾问姓名' })
  @IsNotEmpty()
  @IsString()
  assigneeName: string;
}
