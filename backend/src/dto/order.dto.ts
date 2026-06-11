import {
  OrderStatus,
  SupplyDemandReason,
} from '../schemas/order.schema';

export class AddressSnapshotDto {
  contactName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  community?: string;
  detail: string;
  lng?: number;
  lat?: number;
}

export class OnTimeRecordDto {
  scheduled?: boolean;
  arrived?: boolean;
  completed?: boolean;
}

export class CreateOrderDto {
  orderNo: string;
  userId: string;
  serviceId: string;
  addressId: string;
  addressSnapshot: AddressSnapshotDto;
  workerId?: string;
  scheduledAt: Date | string;
  scheduledEndAt?: Date | string;
  duration: number;
  price: number;
  status?: OrderStatus;
  rescheduleCount?: number;
  cancelReason?: string;
  rescheduleReason?: string;
  supplyDemandReason?: SupplyDemandReason;
  actualArrivedAt?: Date | string;
  actualStartedAt?: Date | string;
  actualCompletedAt?: Date | string;
  onTimeRecord?: OnTimeRecordDto;
  community?: string;
  operator?: string;
  remark?: string;
}

export class UpdateOrderDto {
  userId?: string;
  serviceId?: string;
  addressId?: string;
  addressSnapshot?: AddressSnapshotDto;
  workerId?: string;
  scheduledAt?: Date | string;
  scheduledEndAt?: Date | string;
  duration?: number;
  price?: number;
  status?: OrderStatus;
  rescheduleCount?: number;
  cancelReason?: string;
  rescheduleReason?: string;
  supplyDemandReason?: SupplyDemandReason;
  actualArrivedAt?: Date | string;
  actualStartedAt?: Date | string;
  actualCompletedAt?: Date | string;
  onTimeRecord?: OnTimeRecordDto;
  community?: string;
  operator?: string;
  remark?: string;
}

export class OrderQueryDto {
  userId?: string;
  workerId?: string;
  serviceId?: string;
  status?: OrderStatus;
  statuses?: OrderStatus[];
  community?: string;
  scheduledFrom?: Date | string;
  scheduledTo?: Date | string;
  createdFrom?: Date | string;
  createdTo?: Date | string;
  supplyDemandReason?: SupplyDemandReason;
  page?: number;
  pageSize?: number;
}

export class UpdateOrderStatusDto {
  status: OrderStatus;
  operator?: string;
  remark?: string;
  cancelReason?: string;
  rescheduleReason?: string;
  supplyDemandReason?: SupplyDemandReason;
}

export class RescheduleOrderDto {
  scheduledAt: Date | string;
  scheduledEndAt?: Date | string;
  rescheduleReason?: string;
  operator?: string;
}
