import axios from 'axios';
import { get } from './request';
import type {
  ExportRecord,
  ExportRecordQueryParams,
  OrderExportDto,
  PaginatedResult,
} from '@/types';

const RECORDS_PREFIX = '/api/exports/records';
const ORDERS_EXPORT_PREFIX = '/api/exports/orders';

export const downloadFile = (blob: Blob, fileName: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const getExportRecords = (params?: ExportRecordQueryParams): Promise<PaginatedResult<ExportRecord>> => {
  return get<PaginatedResult<ExportRecord>>(RECORDS_PREFIX, params);
};

export const getExportRecord = (id: string): Promise<ExportRecord> => {
  return get<ExportRecord>(`${RECORDS_PREFIX}/${id}`);
};

export const exportOrders = async (
  filterCriteria: Record<string, any>,
  operator: string,
  operatorRole?: string
): Promise<void> => {
  const data: OrderExportDto = {
    filterCriteria,
    operator,
    operatorRole,
  };

  const token = localStorage.getItem('token');
  const response = await axios.post(
    (import.meta.env.VITE_API_URL || '') + ORDERS_EXPORT_PREFIX,
    data,
    {
      responseType: 'blob',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );

  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  const fileName = `订单导出_${timestamp}.xlsx`;

  downloadFile(blob, fileName);
};
