import {
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

class TriggerConditionDto {
  @IsString()
  @IsOptional()
  event?: string;

  @IsOptional()
  params?: Record<string, any>;
}

class ActionDto {
  @IsNumber()
  @IsOptional()
  remindHours?: number;

  @IsArray()
  @IsOptional()
  remindMethod?: string[];

  @IsArray()
  @IsOptional()
  remindTarget?: string[];
}

class ScopeDto {
  @IsArray()
  @IsOptional()
  departments?: string[];

  @IsArray()
  @IsOptional()
  roles?: string[];

  @IsArray()
  @IsOptional()
  leadSources?: string[];
}

export class UpdateFollowupRuleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @ValidateNested()
  @Type(() => TriggerConditionDto)
  @IsOptional()
  triggerCondition?: TriggerConditionDto;

  @ValidateNested()
  @Type(() => ActionDto)
  @IsOptional()
  action?: ActionDto;

  @ValidateNested()
  @Type(() => ScopeDto)
  @IsOptional()
  scope?: ScopeDto;

  @IsNumber()
  @IsOptional()
  priority?: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
