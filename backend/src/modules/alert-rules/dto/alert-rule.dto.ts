import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  RuleCondition,
  NotificationChannel,
  RuleStatus,
} from '../schemas/alert-rule.schema';

class ConditionDto implements RuleCondition {
  @IsString()
  field: string;

  @IsEnum(['gt', 'lt', 'gte', 'lte', 'eq', 'ne'])
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'ne';

  value: number | string;
}

export class CreateAlertRuleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  datasetId: string;

  @IsString()
  metricName: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConditionDto)
  conditions: ConditionDto[];

  @IsOptional()
  @IsEnum(['all', 'any'])
  conditionLogic?: 'all' | 'any';

  @IsOptional()
  @IsArray()
  @IsEnum(['email', 'sms', 'webhook', 'wechat'], { each: true })
  notifyChannels?: NotificationChannel[];

  @IsOptional()
  @IsArray()
  notifyUserIds?: string[];

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  checkIntervalMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  suppressMinutes?: number;
}

export class UpdateAlertRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConditionDto)
  conditions?: ConditionDto[];

  @IsOptional()
  @IsEnum(['all', 'any'])
  conditionLogic?: 'all' | 'any';

  @IsOptional()
  @IsArray()
  @IsEnum(['email', 'sms', 'webhook', 'wechat'], { each: true })
  notifyChannels?: NotificationChannel[];

  @IsOptional()
  @IsArray()
  notifyUserIds?: string[];

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  checkIntervalMinutes?: number;

  @IsOptional()
  @IsEnum(['enabled', 'disabled'])
  status?: RuleStatus;
}

export class QueryAlertRulesDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  datasetId?: string;

  @IsOptional()
  @IsEnum(['enabled', 'disabled'])
  status?: RuleStatus;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  pageSize?: number = 20;
}
