import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsMongoId()
  head: Types.ObjectId;
}
