import { IsString, IsOptional, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

export class UpdateDepartmentDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsMongoId()
  @IsOptional()
  head?: Types.ObjectId;
}
