import { IsString, IsNumber, IsOptional, IsEnum, IsArray } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsNumber()
  area: number;

  @IsString()
  unitType: string;

  @IsOptional()
  @IsEnum(['vacant', 'rented', 'maintenance', 'reserved'])
  status?: 'vacant' | 'rented' | 'maintenance' | 'reserved';

  @IsNumber()
  monthlyRent: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsNumber()
  vacantDays?: number;

  @IsNumber()
  ownerId: number;
}
