import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PropertiesService } from '../properties/properties.service';
import { LeasesService } from '../leases/leases.service';
import { BillsService } from '../bills/bills.service';
import { DepositsService } from '../deposits/deposits.service';
import { PropertyQueryDto } from '../properties/dto/property-query.dto';
import { LeaseQueryDto } from '../leases/dto/lease-query.dto';
import { BillQueryDto } from '../bills/dto/bill-query.dto';
import { DepositQueryDto } from '../deposits/dto/deposit-query.dto';

export type ExportType = 'properties' | 'leases' | 'bills' | 'deposits';

@Injectable()
export class ExportService {
  constructor(
    private propertiesService: PropertiesService,
    private leasesService: LeasesService,
    private billsService: BillsService,
    private depositsService: DepositsService,
  ) {}

  async export(type: ExportType, query?: any): Promise<Buffer> {
    let buffer: any;
    switch (type) {
      case 'properties':
        buffer = await this.exportProperties(query);
        break;
      case 'leases':
        buffer = await this.exportLeases(query);
        break;
      case 'bills':
        buffer = await this.exportBills(query);
        break;
      case 'deposits':
        buffer = await this.exportDeposits(query);
        break;
      default:
        throw new BadRequestException(`不支持的导出类型: ${type}`);
    }
    return Buffer.from(buffer as ArrayBuffer);
  }

  private async exportProperties(query?: PropertyQueryDto): Promise<any> {
    const { items } = await this.propertiesService.findAll({
      ...query,
      page: 1,
      pageSize: 10000,
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('房源列表');

    worksheet.columns = [
      { header: '编号', key: 'code', width: 15 },
      { header: '名称', key: 'name', width: 20 },
      { header: '类型', key: 'type', width: 15 },
      { header: '面积(㎡)', key: 'area', width: 12 },
      { header: '容纳人数', key: 'capacity', width: 12 },
      { header: '楼层', key: 'floor', width: 10 },
      { header: '楼栋', key: 'building', width: 15 },
      { header: '状态', key: 'status', width: 12 },
      { header: '基础价格', key: 'basePrice', width: 15 },
      { header: '描述', key: 'description', width: 30 },
      { header: '来源', key: 'source', width: 15 },
      { header: '来源备注', key: 'sourceRemark', width: 20 },
      { header: '创建时间', key: 'createdAt', width: 20 },
    ];

    items.forEach((item) => {
      worksheet.addRow({
        code: item.code,
        name: item.name,
        type: this.getPropertyTypeName(item.type),
        area: item.area,
        capacity: item.capacity,
        floor: item.floor,
        building: item.building,
        status: this.getPropertyStatusName(item.status),
        basePrice: item.basePrice,
        description: item.description,
        source: item.source,
        sourceRemark: item.sourceRemark,
        createdAt: item.createdAt,
      });
    });

    worksheet.getRow(1).font = { bold: true };

    return await workbook.xlsx.writeBuffer();
  }

  private async exportLeases(query?: LeaseQueryDto): Promise<any> {
    const { items } = await this.leasesService.findAll({
      ...query,
      page: 1,
      pageSize: 10000,
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('租约列表');

    worksheet.columns = [
      { header: '租约编号', key: 'leaseNo', width: 15 },
      { header: '房源', key: 'property', width: 20 },
      { header: '租户名称', key: 'tenantName', width: 15 },
      { header: '租户联系方式', key: 'tenantContact', width: 15 },
      { header: '开始日期', key: 'startDate', width: 12 },
      { header: '结束日期', key: 'endDate', width: 12 },
      { header: '月租金', key: 'monthlyRent', width: 15 },
      { header: '押金金额', key: 'depositAmount', width: 15 },
      { header: '状态', key: 'status', width: 12 },
      { header: '备注', key: 'remarks', width: 30 },
      { header: '来源', key: 'source', width: 15 },
      { header: '来源备注', key: 'sourceRemark', width: 20 },
      { header: '创建时间', key: 'createdAt', width: 20 },
    ];

    items.forEach((item) => {
      worksheet.addRow({
        leaseNo: item.leaseNo,
        property: item.property?.name || '',
        tenantName: item.tenantName,
        tenantContact: item.tenantContact,
        startDate: item.startDate,
        endDate: item.endDate,
        monthlyRent: item.monthlyRent,
        depositAmount: item.depositAmount,
        status: this.getLeaseStatusName(item.status),
        remarks: item.remarks,
        source: item.source,
        sourceRemark: item.sourceRemark,
        createdAt: item.createdAt,
      });
    });

    worksheet.getRow(1).font = { bold: true };

    return await workbook.xlsx.writeBuffer();
  }

  private async exportBills(query?: BillQueryDto): Promise<any> {
    const { items } = await this.billsService.findAll({
      ...query,
      page: 1,
      pageSize: 10000,
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('账单列表');

    worksheet.columns = [
      { header: '账单编号', key: 'billNo', width: 15 },
      { header: '租约', key: 'lease', width: 15 },
      { header: '类型', key: 'type', width: 12 },
      { header: '金额', key: 'amount', width: 15 },
      { header: '账单日期', key: 'billDate', width: 12 },
      { header: '到期日期', key: 'dueDate', width: 12 },
      { header: '状态', key: 'status', width: 12 },
      { header: '已付金额', key: 'paidAmount', width: 15 },
      { header: '支付日期', key: 'paidDate', width: 12 },
      { header: '是否对账', key: 'reconciled', width: 12 },
      { header: '对账时间', key: 'reconciledAt', width: 20 },
      { header: '来源', key: 'source', width: 15 },
      { header: '来源备注', key: 'sourceRemark', width: 20 },
      { header: '备注', key: 'remarks', width: 30 },
      { header: '创建时间', key: 'createdAt', width: 20 },
    ];

    items.forEach((item) => {
      worksheet.addRow({
        billNo: item.billNo,
        lease: item.lease?.leaseNo || '',
        type: this.getBillTypeName(item.type),
        amount: item.amount,
        billDate: item.billDate,
        dueDate: item.dueDate,
        status: this.getBillStatusName(item.status),
        paidAmount: item.paidAmount,
        paidDate: item.paidDate,
        reconciled: item.reconciled ? '是' : '否',
        reconciledAt: item.reconciledAt,
        source: item.source,
        sourceRemark: item.sourceRemark,
        remarks: item.remarks,
        createdAt: item.createdAt,
      });
    });

    worksheet.getRow(1).font = { bold: true };

    return await workbook.xlsx.writeBuffer();
  }

  private async exportDeposits(query?: DepositQueryDto): Promise<any> {
    const { items } = await this.depositsService.findAll({
      ...query,
      page: 1,
      pageSize: 10000,
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('押金列表');

    worksheet.columns = [
      { header: '押金编号', key: 'depositNo', width: 15 },
      { header: '租约', key: 'lease', width: 15 },
      { header: '金额', key: 'amount', width: 15 },
      { header: '类型', key: 'type', width: 12 },
      { header: '状态', key: 'status', width: 12 },
      { header: '收款日期', key: 'receiveDate', width: 12 },
      { header: '退款日期', key: 'refundDate', width: 12 },
      { header: '来源', key: 'source', width: 15 },
      { header: '来源备注', key: 'sourceRemark', width: 20 },
      { header: '备注', key: 'remarks', width: 30 },
      { header: '创建时间', key: 'createdAt', width: 20 },
    ];

    items.forEach((item) => {
      worksheet.addRow({
        depositNo: item.depositNo,
        lease: item.lease?.leaseNo || '',
        amount: item.amount,
        type: this.getDepositTypeName(item.type),
        status: this.getDepositStatusName(item.status),
        receiveDate: item.receiveDate,
        refundDate: item.refundDate,
        source: item.source,
        sourceRemark: item.sourceRemark,
        remarks: item.remarks,
        createdAt: item.createdAt,
      });
    });

    worksheet.getRow(1).font = { bold: true };

    return await workbook.xlsx.writeBuffer();
  }

  private getPropertyTypeName(type: string): string {
    const names: Record<string, string> = {
      private_office: '独立办公室',
      hot_desk: '开放工位',
      meeting_room: '会议室',
      long_term: '长期租赁',
    };
    return names[type] || type;
  }

  private getPropertyStatusName(status: string): string {
    const names: Record<string, string> = {
      vacant: '空置',
      rented: '已租',
      maintenance: '维修中',
      closed: '关闭',
    };
    return names[status] || status;
  }

  private getLeaseStatusName(status: string): string {
    const names: Record<string, string> = {
      active: '有效',
      expired: '已过期',
      terminated: '已终止',
    };
    return names[status] || status;
  }

  private getBillTypeName(type: string): string {
    const names: Record<string, string> = {
      rent: '租金',
      deposit: '押金',
      service: '服务费',
      other: '其他',
    };
    return names[type] || type;
  }

  private getBillStatusName(status: string): string {
    const names: Record<string, string> = {
      unpaid: '未付',
      paid: '已付',
      partial: '部分支付',
      void: '作废',
    };
    return names[status] || status;
  }

  private getDepositTypeName(type: string): string {
    const names: Record<string, string> = {
      received: '已收',
      refunded: '已退',
      deducted: '扣除',
    };
    return names[type] || type;
  }

  private getDepositStatusName(status: string): string {
    const names: Record<string, string> = {
      active: '有效',
      refunded: '已退还',
      deducted: '已扣除',
    };
    return names[status] || status;
  }
}
