export class CreateAddressDto {
  userId: string;
  contactName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  community?: string;
  detail: string;
  lng?: number;
  lat?: number;
  isDefault?: boolean;
}

export class UpdateAddressDto {
  userId?: string;
  contactName?: string;
  phone?: string;
  province?: string;
  city?: string;
  district?: string;
  community?: string;
  detail?: string;
  lng?: number;
  lat?: number;
  isDefault?: boolean;
}

export class QueryAddressDto {
  userId?: string;
  isDefault?: boolean;
  page?: number;
  limit?: number;
  pageSize?: number;
}

export class SetDefaultDto {
  userId: string;
}
