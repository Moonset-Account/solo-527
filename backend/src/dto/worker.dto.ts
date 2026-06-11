export class CreateWorkerDto {
  name: string;
  phone: string;
  idCard: string;
  skills?: string[];
  rating?: number;
  status?: 'on' | 'off';
  community?: string;
  hireDate: Date | string;
}

export class UpdateWorkerDto {
  name?: string;
  phone?: string;
  idCard?: string;
  skills?: string[];
  rating?: number;
  status?: 'on' | 'off';
  community?: string;
  hireDate?: Date | string;
}

export class QueryWorkerDto {
  status?: 'on' | 'off';
  community?: string;
  skillId?: string;
  page?: number;
  limit?: number;
  pageSize?: number;
}

export type WorkerQueryDto = QueryWorkerDto;
