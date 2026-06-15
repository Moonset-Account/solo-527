import { IsUUID, IsString, IsDate, IsEnum, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CollectionSeverity, CollectionChannel, CollectionStatus, CustomerResponse } from '@/database/entities';
import { PaginationDto, DateRangeDto } from '@/common/dto/pagination.dto';

export class CreateCollectionRhythmDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsNumber()
  daysOverdue: number;

  @IsEnum(['reminder', 'warning', 'urgent', 'legal'])
  severity: CollectionSeverity;

  @IsEnum(['email', 'sms', 'phone', 'letter', 'in_person'])
  channel: CollectionChannel;

  @IsString()
  template: string;

  @IsOptional()
  @IsString()
  subject: string;

  @IsOptional()
  isActive: boolean;

  @IsOptional()
  @IsNumber()
  priority: number;

  @IsOptional()
  escalationRules: {
    afterDays: number;
    nextRhythmId: string;
    autoEscalate: boolean;
  }[];

  @IsOptional()
  conditions: {
    minAmount?: number;
    maxAmount?: number;
    customerSegments?: string[];
    subscriptionPlans?: string[];
  };
}

export class UpdateCollectionRhythmDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  daysOverdue: number;

  @IsOptional()
  @IsEnum(['reminder', 'warning', 'urgent', 'legal'])
  severity: CollectionSeverity;

  @IsOptional()
  @IsEnum(['email', 'sms', 'phone', 'letter', 'in_person'])
  channel: CollectionChannel;

  @IsOptional()
  @IsString()
  template: string;

  @IsOptional()
  @IsString()
  subject: string;

  @IsOptional()
  isActive: boolean;

  @IsOptional()
  @IsNumber()
  priority: number;
}

export class CreateCollectionRecordDto {
  @IsUUID()
  billId: string;

  @IsOptional()
  @IsUUID()
  rhythmId: string;

  @IsOptional()
  @IsEnum(['pending', 'in_progress', 'completed', 'failed', 'skipped'])
  status: CollectionStatus;

  @IsEnum(['reminder', 'warning', 'urgent', 'legal'])
  severity: CollectionSeverity;

  @IsEnum(['email', 'sms', 'phone', 'letter', 'in_person'])
  channel: CollectionChannel;

  @IsOptional()
  @IsEnum(['no_response', 'promised_to_pay', 'disputed', 'negotiated', 'paid'])
  customerResponse: CustomerResponse;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  contactDate: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  scheduledDate: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  promisedPaymentDate: Date;

  @IsOptional()
  @IsNumber()
  promisedAmount: number;

  @IsOptional()
  @IsString()
  notes: string;

  @IsOptional()
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  conversationRecord: string;

  @IsOptional()
  followUpActions: {
    action: string;
    scheduledDate: Date;
    assignee: string;
    completed: boolean;
  }[];
}

export class UpdateCollectionRecordDto {
  @IsOptional()
  @IsEnum(['pending', 'in_progress', 'completed', 'failed', 'skipped'])
  status: CollectionStatus;

  @IsOptional()
  @IsEnum(['no_response', 'promised_to_pay', 'disputed', 'negotiated', 'paid'])
  customerResponse: CustomerResponse;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  contactDate: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  promisedPaymentDate: Date;

  @IsOptional()
  @IsNumber()
  promisedAmount: number;

  @IsOptional()
  @IsString()
  notes: string;

  @IsOptional()
  @IsString()
  conversationRecord: string;
}

export class CollectionFilterDto extends PaginationDto implements DateRangeDto {
  @IsOptional()
  @IsUUID()
  billId: string;

  @IsOptional()
  @IsUUID()
  rhythmId: string;

  @IsOptional()
  @IsEnum(['pending', 'in_progress', 'completed', 'failed', 'skipped'], { each: true })
  status: CollectionStatus[];

  @IsOptional()
  @IsEnum(['reminder', 'warning', 'urgent', 'legal'], { each: true })
  severity: CollectionSeverity[];

  @IsOptional()
  @IsEnum(['email', 'sms', 'phone', 'letter', 'in_person'], { each: true })
  channel: CollectionChannel[];

  @IsOptional()
  @IsEnum(['no_response', 'promised_to_pay', 'disputed', 'negotiated', 'paid'], { each: true })
  customerResponse: CustomerResponse[];

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate: Date;
}

export class RhythmFilterDto extends PaginationDto {
  @IsOptional()
  @IsEnum(['reminder', 'warning', 'urgent', 'legal'], { each: true })
  severity: CollectionSeverity[];

  @IsOptional()
  @IsEnum(['email', 'sms', 'phone', 'letter', 'in_person'], { each: true })
  channel: CollectionChannel[];

  @IsOptional()
  isActive: boolean;
}
