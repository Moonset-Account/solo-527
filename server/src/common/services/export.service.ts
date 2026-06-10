import { Injectable } from '@nestjs/common';
import { Workbook, Worksheet, Column } from 'exceljs';
import * as dayjs from 'dayjs';

export interface ExportColumn {
  key: string;
  header: string;
  width?: number;
  format?: string;
}

export interface ExportData {
  columns: ExportColumn[];
  rows: Record<string, any>[];
  sheetName?: string;
  title?: string;
  filterInfo?: Record<string, any>;
  operator?: string;
}

@Injectable()
export class ExportService {
  async exportToExcel(data: ExportData): Promise<Buffer> {
    const workbook = new Workbook();
    workbook.creator = '青禾订单履约台';
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet(data.sheetName || '导出数据');

    if (data.title) {
      const titleRow = worksheet.addRow([data.title]);
      titleRow.font = { size: 16, bold: true };
      titleRow.alignment = { horizontal: 'center' };
      worksheet.mergeCells(1, 1, 1, data.columns.length);
    }

    if (data.filterInfo || data.operator) {
      const infoRows: string[] = [];
      if (data.filterInfo) {
        infoRows.push(`筛选条件: ${JSON.stringify(data.filterInfo)}`);
      }
      infoRows.push(`导出时间: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`);
      if (data.operator) {
        infoRows.push(`操作者: ${data.operator}`);
      }

      infoRows.forEach((info, index) => {
        const rowNum = (data.title ? 2 : 1) + index;
        const row = worksheet.addRow([info]);
        row.font = { size: 10, color: { argb: '666666' } };
        worksheet.mergeCells(rowNum, 1, rowNum, data.columns.length);
      });
    }

    const headerRowNum = (data.title ? 2 : 1) + (data.filterInfo || data.operator ? 3 : 0);
    worksheet.columns = data.columns.map(col => ({
      header: col.header,
      key: col.key,
      width: col.width || 15,
    }));

    const headerRow = worksheet.getRow(headerRowNum);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    data.rows.forEach(row => {
      const formattedRow: Record<string, any> = {};
      data.columns.forEach(col => {
        let value = row[col.key];
        if (col.format && value !== null && value !== undefined) {
          if (col.format === 'date') {
            value = dayjs(value).format('YYYY-MM-DD');
          } else if (col.format === 'datetime') {
            value = dayjs(value).format('YYYY-MM-DD HH:mm:ss');
          }
        }
        formattedRow[col.key] = value;
      });
      worksheet.addRow(formattedRow);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  }
}
