'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import type { Prescription } from '@/types';
import { formatDateTime, formatMinutes, getPrescriptionTypeName } from '@/utils/formatters';
import { cn } from '@/utils/formatters';

interface Column {
  key: keyof Prescription | 'actions';
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: Prescription) => React.ReactNode;
}

interface Props {
  data: Prescription[];
  onAddRemark?: (prescription: Prescription) => void;
  onViewDetail?: (prescription: Prescription) => void;
}

export default function DataTable({ data, onAddRemark, onViewDetail }: Props) {
  const [sortKey, setSortKey] = useState<keyof Prescription | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const columns: Column[] = [
    { key: 'prescriptionNo', label: '处方编号', sortable: true },
    {
      key: 'type',
      label: '处方类型',
      sortable: true,
      render: (value) => {
        const typeMap: Record<string, { label: string; className: string }> = {
          emergency: { label: '急诊', className: 'bg-red-100 text-red-700' },
          normal: { label: '普通', className: 'bg-blue-100 text-blue-700' },
          specialist: { label: '专科', className: 'bg-green-100 text-green-700' },
        };
        const type = typeMap[value] || { label: value, className: 'bg-gray-100 text-gray-700' };
        return (
          <span className={cn('px-2 py-0.5 rounded text-xs font-medium', type.className)}>
            {type.label}
          </span>
        );
      },
    },
    { key: 'departmentName', label: '开方科室', sortable: true },
    { key: 'windowNo', label: '取药窗口', sortable: true, render: (v) => `${v}号窗` },
    { key: 'pharmacistName', label: '配药药师', sortable: true },
    {
      key: 'waitTime',
      label: '总等待时长',
      sortable: true,
      render: (value, row) => (
        <span className={cn(
          'font-mono',
          value > 45 ? 'text-red-600 font-medium' : value > 30 ? 'text-orange-600' : 'text-gray-700'
        )}>
          {formatMinutes(value)}
        </span>
      ),
    },
    {
      key: 'dispenseTime',
      label: '配药时长',
      sortable: true,
      render: (value) => <span className="font-mono">{formatMinutes(value)}</span>,
    },
    {
      key: 'createdAt',
      label: '开方时间',
      sortable: true,
      render: (value) => <span className="text-xs text-gray-600">{formatDateTime(value)}</span>,
    },
    {
      key: 'refundedAt',
      label: '状态',
      render: (value) =>
        value ? (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
            已退药
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
            已取药
          </span>
        ),
    },
    {
      key: 'actions',
      label: '操作',
      width: '120px',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddRemark?.(row)}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-primary-500"
            title="添加备注"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewDetail?.(row)}
            className="text-xs text-primary-500 hover:text-primary-600"
          >
            详情
          </button>
        </div>
      ),
    },
  ];

  const handleSort = (key: keyof Prescription) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                    col.width ? `w-${col.width}` : '',
                    col.sortable ? 'cursor-pointer select-none hover:bg-gray-100' : ''
                  )}
                  onClick={() => col.sortable && handleSort(col.key as keyof Prescription)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortOrder === 'asc' ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">
                  暂无数据
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr
                  key={row.id}
                  className={cn(
                    'hover:bg-gray-50 transition-colors',
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
                      {col.render ? col.render(row[col.key as keyof Prescription], row) : row[col.key as keyof Prescription]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          共 <span className="font-medium text-gray-900">{data.length}</span> 条记录，第{' '}
          <span className="font-medium text-gray-900">{currentPage}</span> / {totalPages} 页
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  'w-8 h-8 rounded text-sm transition-colors',
                  currentPage === page
                    ? 'bg-primary-500 text-white'
                    : 'hover:bg-gray-100 text-gray-600'
                )}
              >
                {page}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
