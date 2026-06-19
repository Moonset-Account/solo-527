import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class NoShowDto {
  @ApiProperty({ description: '爽约原因' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}
