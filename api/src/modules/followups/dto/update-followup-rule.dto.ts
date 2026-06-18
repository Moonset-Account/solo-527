import {
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class UpdateFollowupRuleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  triggerEvent?: string;

  @IsOptional()
  triggerParams?: Record<string, any>;

  @IsNumber()
  @IsOptional()
  actionRemindHours?: number;

  @IsArray()
  @IsOptional()
  actionMethods?: string[];

  @IsString()
  @IsOptional()
  actionTarget?: string;

  @IsArray()
  @IsOptional()
  scopeDepartments?: string[];

  @IsArray()
  @IsOptional()
  scopeRoles?: string[];

  @IsArray()
  @IsOptional()
  scopeSources?: string[];

  @IsNumber()
  @IsOptional()
  priority?: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
