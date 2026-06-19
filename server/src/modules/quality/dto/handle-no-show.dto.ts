import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class HandleNoShowDto {
  @ApiProperty({ description: '处理备注' })
  @IsNotEmpty()
  @IsString()
  remark: string;
}
