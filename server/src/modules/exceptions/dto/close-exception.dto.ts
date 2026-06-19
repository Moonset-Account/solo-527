import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CloseExceptionDto {
  @ApiProperty({ description: '关闭原因' })
  @IsNotEmpty()
  @IsString()
  closeReason: string;
}
