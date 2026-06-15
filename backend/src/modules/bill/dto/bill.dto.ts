import { IsUUID, IsNumber, IsString, IsDate, IsEnum, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BillStatus } from '@/database/entities';
import { PaginationDto, DateRangeDto } from '@/common/dto/pagination.dto';

export class BillItemDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  amount: number;
}

export class CreateBillDto {
  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsUUID()
  subscriptionId: string;

  @IsNumber()
  totalAmount: number;

  @IsString()
  currency: string;

  @IsDate()
  @Type(() => Date)
  issueDate: Date;

  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @IsOptional()
  @IsEnum(['draft', 'issued', 'pending', 'partial', 'paid', 'overdue', 'written_off', 'disputed'])
  status: BillStatus;

  @IsOptional()
  @IsNumber()
  interestRate: number;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillItemDto)
  items: BillItemDto[];

  @IsOptional()
  paymentTerms: {
    method: string;
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
  };
}

export class UpdateBillDto {
  @IsOptional()
  @IsNumber()
  totalAmount: number;

  @IsOptional()
  @IsEnum(['draft', 'issued', 'pending', 'partial', 'paid', 'overdue', 'written_off', 'disputed'])
  status: BillStatus;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @IsOptional()
  @IsNumber()
  paidAmount: number;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillItemDto)
  items: BillItemDto[];
}

export class UpdateBillStatusDto {
  @IsEnum(['draft', 'issued', 'pending', 'partial', 'paid', 'overdue', 'written_off', 'disputed'])
  status: BillStatus;

  @IsOptional()
  @IsString()
  reason: string;
}

export class RecordPaymentDto {
  @IsNumber()
  amount: number;

  @IsDate()
  @Type(() => Date)
  paymentDate: Date;

  @IsOptional()
  @IsString()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  transactionId: string;

  @IsOptional()
  @IsString()
  notes: string;
}

export class BillFilterDto extends PaginationDto implements DateRangeDto {
  @IsOptional()
  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsUUID()
  subscriptionId: string;

  @IsOptional()
  @IsEnum(['draft', 'issued', 'pending', 'partial', 'paid', 'overdue', 'written_off', 'disputed'], { each: true })
  status: BillStatus[];

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDateStart: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDateEnd: Date;

  @IsOptional()
  @IsString()
  billNumber: string;

  @IsOptional()
  minOverdueDays: number;

  @IsOptional()
  maxOverdueDays: number;

  @IsOptional()
  minAmount: number;

  @IsOptional()
  maxAmount: number;
}
