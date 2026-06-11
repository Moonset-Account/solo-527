import { Types } from 'mongoose';
import { OrderStatus, SupplyDemandReason } from '../../../schemas/order.schema';

export class CreateOrderDto {
  userId: Types.ObjectId;
  serviceId: Types.ObjectId;
  addressId: Types.ObjectId;
  scheduledAt: Date;
  remark?: string;
  supplyDemandReason?: SupplyDemandReason;
}

export class QueryOrdersDto {
  status?: OrderStatus | OrderStatus[];
  startTime?: Date;
  endTime?: Date;
  community?: string;
  communities?: string[];
  workerId?: Types.ObjectId;
  userId?: Types.ObjectId;
  supplyDemandReason?: SupplyDemandReason;
  page?: number;
  pageSize?: number;
}

export class DispatchOrderDto {
  orderId: Types.ObjectId;
  workerId: Types.ObjectId;
  operator?: {
    id?: Types.ObjectId;
    name: string;
    role?: string;
  };
}

export class RescheduleOrderDto {
  orderId: Types.ObjectId;
  newScheduledAt: Date;
  reason: string;
  operator?: {
    id?: Types.ObjectId;
    name: string;
    role?: string;
  };
}

export class CancelOrderDto {
  orderId: Types.ObjectId;
  reason: string;
  operator?: {
    id?: Types.ObjectId;
    name: string;
    role?: string;
  };
}

export class UpdateFulfillmentDto {
  orderId: Types.ObjectId;
}

export class BatchQueryDto {
  addressIds?: Types.ObjectId[];
  communities?: string[];
  timeRange?: {
    startTime: Date;
    endTime: Date;
  };
}

export class MarkSupplyDemandReasonDto {
  orderId: Types.ObjectId;
  supplyDemandReason: SupplyDemandReason;
}
