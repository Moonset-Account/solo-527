import { IsString, IsNumber, IsOptional, IsEnum, IsDateString } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  roomNumber: string;

  @IsString()
  building: string;

  @IsNumber()
  floor: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  area: number;

  @IsNumber()
  rentPrice: number;

  @IsNumber()
  deposit: number;

  @IsOptional()
  @IsEnum(['vacant', 'rented', 'maintenance', 'reserved'])
  status?: 'vacant' | 'rented' | 'maintenance' | 'reserved';

  @IsOptional()
  @IsString()
  description?: string;
}
