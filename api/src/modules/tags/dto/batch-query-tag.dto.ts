import { IsArray, IsNotEmpty, IsIn } from 'class-validator';

export class BatchQueryTagDto {
  @IsArray()
  @IsNotEmpty()
  tagIds: string[];

  @IsIn(['AND', 'OR'])
  @IsNotEmpty()
  logic: 'AND' | 'OR';
}
