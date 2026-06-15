import { IsString, IsUUID, IsNumber, IsOptional, IsEnum, IsDateString } from 'class-validator';

export type InvoiceStatus = 'draft' | 'issued' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export class CreateInvoiceDto {
  @IsUUID()
  billId: string;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsEnum(['draft', 'issued', 'sent', 'paid', 'overdue', 'cancelled'])
  @IsOptional()
  status?: InvoiceStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateInvoiceDto {
  @IsEnum(['draft', 'issued', 'sent', 'paid', 'overdue', 'cancelled'])
  @IsOptional()
  status?: InvoiceStatus;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsOptional()
  paidDate?: string;

  @IsNumber()
  @IsOptional()
  paidAmount?: number;
}

export class InvoiceFilterDto {
  @IsUUID()
  @IsOptional()
  billId?: string;

  @IsUUID()
  @IsOptional()
  customerId?: string;

  @IsEnum(['draft', 'issued', 'sent', 'paid', 'overdue', 'cancelled'])
  @IsOptional()
  status?: InvoiceStatus;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  limit?: number = 10;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsString()
  @IsOptional()
  sortOrder?: string;
}
