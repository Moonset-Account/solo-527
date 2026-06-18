import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class BatchQueryTagDto {
  @IsArray()
  @IsNotEmpty()
  names: string[];
}
