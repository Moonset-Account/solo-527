import { IsArray, IsNotEmpty } from 'class-validator';

export class BatchTagDto {
  @IsArray()
  @IsNotEmpty()
  leadIds: string[];

  @IsArray()
  @IsNotEmpty()
  tags: string[];
}
