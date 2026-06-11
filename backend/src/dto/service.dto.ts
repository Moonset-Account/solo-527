export class CreateServiceDto {
  name: string;
  category: string;
  duration: number;
  price: number;
  unit: string;
  description?: string;
  enabled?: boolean;
}

export class UpdateServiceDto {
  name?: string;
  category?: string;
  duration?: number;
  price?: number;
  unit?: string;
  description?: string;
  enabled?: boolean;
}

export class QueryServiceDto {
  category?: string;
  enabled?: boolean;
  page?: number;
  limit?: number;
  pageSize?: number;
}

export type ServiceQueryDto = QueryServiceDto;
