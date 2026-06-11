export class ChangeLogItemDto {
  oldValue?: any;
  newValue?: any;
  modifiedBy?: string;
  modifiedAt?: Date | string;
  operator?: string;
  timestamp?: Date | string;
}

export class CreateConfigDto {
  key: string;
  value: any;
  type: string;
  enabled?: boolean;
  isEnabled?: boolean;
  remark?: string;
  description?: string;
  modifiedBy?: string;
  version?: number;
  changeLog?: ChangeLogItemDto[];
}

export class UpdateConfigDto {
  value?: any;
  type?: string;
  enabled?: boolean;
  isEnabled?: boolean;
  remark?: string;
  description?: string;
  modifiedBy?: string;
  operator?: string;
  version?: number;
  changeLog?: ChangeLogItemDto[];
}

export class ToggleConfigDto {
  modifiedBy?: string;
  remark?: string;
}

export class QueryConfigDto {
  key?: string;
  type?: string;
  enabled?: boolean;
  isEnabled?: boolean;
  page?: number;
  limit?: number;
  pageSize?: number;
}

export class BatchUpdateConfigDto {
  items: {
    key: string;
    value: any;
    modifiedBy?: string;
  }[];
}

export type ConfigQueryDto = QueryConfigDto;
