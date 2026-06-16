import { IsNumber, IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateWorkOrderDto {
  @IsNumber()
  roomId: number;

  @IsNumber()
  userId: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['repair', 'clean', 'inspect', 'other'])
  type?: 'repair' | 'clean' | 'inspect' | 'other';

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  @IsOptional()
  @IsNumber()
  assignedTo?: number;
}
