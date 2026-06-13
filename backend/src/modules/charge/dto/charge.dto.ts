import { IsString, IsNotEmpty, IsUUID, IsEnum, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateChargeDto {
  @IsUUID()
  @IsOptional()
  prescriptionId?: string;

  @IsUUID()
  @IsNotEmpty({ message: '患者ID不能为空' })
  patientId: string;

  @IsNumber()
  @IsNotEmpty({ message: '总金额不能为空' })
  totalAmount: number;

  @IsNumber()
  @IsOptional()
  discountAmount?: number;

  @IsNumber()
  @IsNotEmpty({ message: '应收金额不能为空' })
  actualAmount: number;

  @IsEnum(['cash', 'wechat', 'alipay', 'card', 'insurance', 'other'], {
    message: '支付方式不正确',
  })
  @IsOptional()
  paymentMethod?: string;
}

export class PayChargeDto {
  @IsNumber()
  @IsNotEmpty({ message: '支付金额不能为空' })
  paidAmount: number;

  @IsEnum(['cash', 'wechat', 'alipay', 'card', 'insurance', 'other'], {
    message: '支付方式不正确',
  })
  @IsNotEmpty({ message: '支付方式不能为空' })
  paymentMethod: string;
}

export class CheckChargeDto {
  @IsBoolean()
  @IsNotEmpty({ message: '是否准确不能为空' })
  isAccurate: boolean;

  @IsString()
  @IsOptional()
  accuracyNotes?: string;

  @IsNumber()
  @IsNotEmpty({ message: '核对金额不能为空' })
  checkedAmount: number;

  @IsNumber()
  @IsOptional()
  differenceAmount?: number;
}

export class ChargeListQueryDto {
  page?: number;
  pageSize?: number;
  patientId?: string;
  status?: string;
  isChecked?: string;
  startDate?: string;
  endDate?: string;
}
