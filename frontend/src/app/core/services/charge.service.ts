import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PageResult } from './api.service';

export interface ChargeItem {
  id: number;
  chargeId: number;
  itemName: string;
  itemType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount: number;
  actualPrice: number;
}

export interface Charge {
  id: number;
  chargeNo: string;
  patientId: number;
  patientName: string;
  prescriptionId?: number;
  clinicId: number;
  clinicName: string;
  totalAmount: number;
  discountAmount: number;
  actualAmount: number;
  paymentMethod: string;
  status: 'pending' | 'paid' | 'refunded' | 'cancelled';
  chargedBy: number;
  chargedByName: string;
  chargedAt: string;
  items: ChargeItem[];
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChargeAccuracy {
  id: number;
  chargeId: number;
  checkedBy: number;
  checkedByName: string;
  isAccurate: boolean;
  issues: string;
  checkedAt: string;
}

export interface CreateChargeDto {
  patientId: number;
  prescriptionId?: number;
  paymentMethod: string;
  items: {
    itemName: string;
    itemType: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }[];
  remarks?: string;
}

export interface UpdateChargeDto {
  paymentMethod?: string;
  status?: string;
  remarks?: string;
}

@Injectable({ providedIn: 'root' })
export class ChargeService {
  private endpoint = '/charges';

  constructor(private api: ApiService) {}

  getCharges(page: number = 1, pageSize: number = 10, filters?: Record<string, any>): Observable<PageResult<Charge>> {
    return this.api.getPage<Charge>(this.endpoint, page, pageSize, filters);
  }

  getCharge(id: number): Observable<Charge> {
    return this.api.get<Charge>(`${this.endpoint}/${id}`);
  }

  createCharge(data: CreateChargeDto): Observable<Charge> {
    return this.api.post<Charge>(this.endpoint, data);
  }

  updateCharge(id: number, data: UpdateChargeDto): Observable<Charge> {
    return this.api.put<Charge>(`${this.endpoint}/${id}`, data);
  }

  updateStatus(id: number, status: string): Observable<Charge> {
    return this.api.patch<Charge>(`${this.endpoint}/${id}/status`, { status });
  }

  refundCharge(id: number, reason: string): Observable<Charge> {
    return this.api.post<Charge>(`${this.endpoint}/${id}/refund`, { reason });
  }

  checkAccuracy(id: number, data: { isAccurate: boolean; issues?: string }): Observable<ChargeAccuracy> {
    return this.api.post<ChargeAccuracy>(`${this.endpoint}/${id}/check-accuracy`, data);
  }

  getAccuracyChecks(chargeId: number): Observable<ChargeAccuracy[]> {
    return this.api.get<ChargeAccuracy[]>(`${this.endpoint}/${chargeId}/accuracy-checks`);
  }

  getStatistics(startDate?: string, endDate?: string): Observable<any> {
    return this.api.get<any>(`${this.endpoint}/statistics`, { startDate, endDate });
  }
}
