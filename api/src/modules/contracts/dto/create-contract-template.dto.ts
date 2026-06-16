import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateContractTemplateDto {
  @IsString()
  name: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
