import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BillService } from '../../services/bill.service';
import { CollectionService } from '../../services/collection.service';
import { Bill, StatusHistory, CollectionRecord } from '../../services/api.config';

interface CustomerOverview {
  customerId: string;
  customerName: string;
  totalReceivable: number;
  totalPaid: number;
  totalOverdue: number;
  billCount: number;
}

interface CustomerOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-customer-success',
  template: `
    <div class="customer-success-container">
      <div class="page-header">
        <h2>客户成功视图</h2>
        <div class="customer-filter">
          <mat-form-field appearance="outline">
            <mat-label>选择客户</mat-label>
            <mat-select [formControl]="customerControl">
              <mat-option *ngFor="let customer of customerOptions" [value]="customer.id">
                {{ customer.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </div>

      <div class="overview-cards" *ngIf="customerOverview">
        <mat-card class="overview-card">
          <mat-card-content>
            <div class="card-icon receivable">
              <mat-icon>account_balance_wallet</mat-icon>
            </div>
            <div class="card-info">
              <div class="card-label">应收总额</div>
              <div class="card-value">{{ customerOverview.totalReceivable | formatCurrency }}</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="overview-card">
          <mat-card-content>
            <div class="card-icon paid">
              <mat-icon>check_circle</mat-icon>
            </div>
            <div class="card-info">
              <div class="card-label">已付总额</div>
              <div class="card-value positive">{{ customerOverview.totalPaid | formatCurrency }}</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="overview-card">
          <mat-card-content>
            <div class="card-icon overdue">
              <mat-icon>warning</mat-icon>
            </div>
            <div class="card-info">
              <div class="card-label">逾期总额</div>
              <div class="card-value negative">{{ customerOverview.totalOverdue | formatCurrency }}</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="overview-card">
          <mat-card-content>
            <div class="card-icon count">
              <mat-icon>receipt</mat-icon>
            </div>
            <div class="card-info">
              <div class="card-label">账单数</div>
              <div class="card-value">{{ customerOverview.billCount }}</div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="content-grid">
        <div class="main-content">
          <mat-card class="bills-card">
            <mat-card-header>
              <mat-card-title>客户账单</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <table mat-table [dataSource]="billsDataSource" class="full-width-table">
                <ng-container matColumnDef="billNumber">
                  <th mat-header-cell *matHeaderCellDef>账单编号</th>
                  <td mat-cell *matCellDef="let bill">{{ bill.billNumber }}</td>
                </ng-container>

                <ng-container matColumnDef="issueDate">
                  <th mat-header-cell *matHeaderCellDef>出账日期</th>
                  <td mat-cell *matCellDef="let bill">{{ bill.issueDate | formatDate }}</td>
                </ng-container>

                <ng-container matColumnDef="dueDate">
                  <th mat-header-cell *matHeaderCellDef>到期日期</th>
                  <td mat-cell *matCellDef="let bill">
                    <span [class.overdue-text]="bill.status === 'overdue'">
                      {{ bill.dueDate | formatDate }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="totalAmount">
                  <th mat-header-cell *matHeaderCellDef>总金额</th>
                  <td mat-cell *matCellDef="let bill">{{ bill.totalAmount | formatCurrency }}</td>
                </ng-container>

                <ng-container matColumnDef="remainingAmount">
                  <th mat-header-cell *matHeaderCellDef>待付金额</th>
                  <td mat-cell *matCellDef="let bill">
                    <span [class.negative]="bill.remainingAmount > 0">
                      {{ bill.remainingAmount | formatCurrency }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>状态</th>
                  <td mat-cell *matCellDef="let bill">
                    <span [class]="bill.status | statusBadge">
                      {{ bill.status | statusDisplay }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="action">
                  <th mat-header-cell *matHeaderCellDef>操作</th>
                  <td mat-cell *matCellDef="let bill">
                    <button
                      mat-raised-button
                      color="primary"
                      class="payment-btn"
                      (click)="openPaymentDialog(bill)"
                      [disabled]="bill.status === 'paid'"
                    >
                      <mat-icon>payments</mat-icon>
                      登记付款
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="billsDisplayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: billsDisplayedColumns;"></tr>
              </table>

              <div class="empty-state" *ngIf="billsDataSource.data.length === 0">
                <p>该客户暂无账单</p>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="side-content">
          <mat-card class="timeline-card">
            <mat-card-header>
              <mat-card-title>状态历史</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="timeline">
                <div class="timeline-item" *ngFor="let history of statusHistory; let last = last">
                  <div class="timeline-marker">
                    <mat-icon>{{ getStatusIcon(history.toStatus) }}</mat-icon>
                  </div>
                  <div class="timeline-content">
                    <div class="timeline-title">
                      <span [class]="history.toStatus | statusBadge">
                        {{ history.toStatus | statusDisplay }}
                      </span>
                    </div>
                    <div class="timeline-reason" *ngIf="history.reason">{{ history.reason }}</div>
                    <div class="timeline-meta">
                      {{ history.createdAt | formatDateTime }} · {{ history.createdBy }}
                    </div>
                  </div>
                  <div class="timeline-line" *ngIf="!last"></div>
                </div>

                <div class="empty-state" *ngIf="statusHistory.length === 0">
                  <p>暂无状态历史</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="collection-card">
            <mat-card-header>
              <mat-card-title>催收记录</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-list>
                <mat-list-item *ngFor="let record of collectionRecords" class="collection-item">
                  <mat-icon matListItemIcon [class]="'channel-' + record.channel">
                    {{ getChannelIcon(record.channel) }}
                  </mat-icon>
                  <div matListItemTitle class="collection-title">
                    <span class="channel-badge">{{ record.channel | uppercase }}</span>
                    <span class="collection-severity" [class]="'severity-' + record.severity">
                      {{ record.severity | statusDisplay }}
                    </span>
                  </div>
                  <div matListItemLine class="collection-content">
                    {{ record.content || record.notes }}
                  </div>
                  <div matListItemLine class="collection-meta">
                    {{ record.contactDate | formatDateTime }}
                    <span *ngIf="record.promisedPaymentDate">
                      · 承诺付款: {{ record.promisedPaymentDate | formatDate }}
                    </span>
                  </div>
                </mat-list-item>

                <mat-list-item *ngIf="collectionRecords.length === 0">
                  <div matListItemTitle class="empty-state">暂无催收记录</div>
                </mat-list-item>
              </mat-list>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>

    <ng-template #paymentDialogTemplate>
      <div class="payment-dialog">
        <h2 mat-dialog-title>登记付款</h2>
        <mat-dialog-content>
          <div class="payment-bill-info" *ngIf="selectedBill">
            <div class="info-row">
              <span class="info-label">账单编号:</span>
              <span class="info-value">{{ selectedBill.billNumber }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">待付金额:</span>
              <span class="info-value negative">{{ selectedBill.remainingAmount | formatCurrency }}</span>
            </div>
          </div>

          <form [formGroup]="paymentForm" class="payment-form">
            <mat-form-field appearance="outline">
              <mat-label>付款金额</mat-label>
              <input matInput type="number" formControlName="amount" min="0" step="0.01">
              <mat-error *ngIf="paymentForm.get('amount')?.hasError('required')">请输入付款金额</mat-error>
              <mat-error *ngIf="paymentForm.get('amount')?.hasError('min')">金额必须大于0</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>付款日期</mat-label>
              <input matInput [matDatepicker]="paymentDatePicker" formControlName="paymentDate">
              <mat-datepicker-toggle matSuffix [for]="paymentDatePicker"></mat-datepicker-toggle>
              <mat-datepicker #paymentDatePicker></mat-datepicker>
              <mat-error *ngIf="paymentForm.get('paymentDate')?.hasError('required')">请选择付款日期</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>付款方式</mat-label>
              <mat-select formControlName="paymentMethod">
                <mat-option value="bank_transfer">银行转账</mat-option>
                <mat-option value="alipay">支付宝</mat-option>
                <mat-option value="wechat">微信支付</mat-option>
                <mat-option value="cash">现金</mat-option>
                <mat-option value="check">支票</mat-option>
                <mat-option value="other">其他</mat-option>
              </mat-select>
              <mat-error *ngIf="paymentForm.get('paymentMethod')?.hasError('required')">请选择付款方式</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>备注</mat-label>
              <textarea matInput formControlName="notes" rows="3" placeholder="可选"></textarea>
            </mat-form-field>
          </form>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button mat-button (click)="closePaymentDialog()">取消</button>
          <button mat-raised-button color="primary" (click)="submitPayment()" [disabled]="!paymentForm.valid">
            确认登记
          </button>
        </mat-dialog-actions>
      </div>
    </ng-template>
  `,
  styles: [`
    .customer-success-container {
      padding: 24px;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .page-header h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
    }
    .customer-filter mat-form-field {
      width: 300px;
    }
    .overview-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .overview-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .card-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card-icon mat-icon {
      font-size: 32px;
      color: white;
    }
    .card-icon.receivable {
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    }
    .card-icon.paid {
      background: linear-gradient(135deg, #388e3c 0%, #2e7d32 100%);
    }
    .card-icon.overdue {
      background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%);
    }
    .card-icon.count {
      background: linear-gradient(135deg, #f57c00 0%, #ef6c00 100%);
    }
    .card-label {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 4px;
    }
    .card-value {
      font-size: 24px;
      font-weight: 600;
    }
    .card-value.positive {
      color: #2e7d32;
    }
    .card-value.negative {
      color: #c62828;
    }
    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
    }
    .full-width-table {
      width: 100%;
    }
    .payment-btn {
      min-width: 100px;
    }
    .overdue-text {
      color: #c62828;
      font-weight: 500;
    }
    .status-badge {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    .status-pending {
      background: #fff8e1;
      color: #f57f17;
    }
    .status-partial {
      background: #e3f2fd;
      color: #1565c0;
    }
    .status-paid {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .status-overdue {
      background: #ffebee;
      color: #c62828;
    }
    .status-reminder {
      background: #fff3e0;
      color: #e65100;
    }
    .status-warning {
      background: #ffebee;
      color: #c62828;
    }
    .status-urgent {
      background: #ffebee;
      color: #b71c1c;
    }
    .bills-card, .timeline-card, .collection-card {
      margin-bottom: 24px;
    }
    .timeline {
      position: relative;
      padding-left: 8px;
    }
    .timeline-item {
      position: relative;
      padding-bottom: 24px;
      display: flex;
      gap: 16px;
    }
    .timeline-item:last-child {
      padding-bottom: 0;
    }
    .timeline-marker {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #1976d2;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      z-index: 1;
    }
    .timeline-marker mat-icon {
      color: white;
      font-size: 20px;
    }
    .timeline-line {
      position: absolute;
      left: 20px;
      top: 40px;
      bottom: 0;
      width: 2px;
      background: #e0e0e0;
    }
    .timeline-content {
      flex: 1;
      padding-top: 4px;
    }
    .timeline-title {
      margin-bottom: 4px;
    }
    .timeline-reason {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.87);
      margin-bottom: 4px;
    }
    .timeline-meta {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
    }
    .collection-item {
      padding: 12px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .collection-item:last-child {
      border-bottom: none;
    }
    .collection-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .channel-badge {
      padding: 2px 8px;
      background: #e3f2fd;
      color: #1565c0;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    .collection-severity {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }
    .severity-reminder {
      background: #fff8e1;
      color: #f57f17;
    }
    .severity-warning {
      background: #ffe0b2;
      color: #e65100;
    }
    .severity-urgent {
      background: #ffebee;
      color: #c62828;
    }
    .severity-legal {
      background: #f3e5f5;
      color: #7b1fa2;
    }
    .collection-content {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.87);
      margin-bottom: 4px;
    }
    .collection-meta {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
    }
    .channel-email {
      color: #1976d2;
    }
    .channel-phone {
      color: #388e3c;
    }
    .channel-sms {
      color: #f57c00;
    }
    .channel-letter {
      color: #7b1fa2;
    }
    .empty-state {
      text-align: center;
      color: rgba(0, 0, 0, 0.54);
      padding: 24px 0;
    }
    .payment-dialog {
      min-width: 480px;
    }
    .payment-bill-info {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }
    .info-label {
      color: rgba(0, 0, 0, 0.6);
    }
    .info-value {
      font-weight: 500;
    }
    .info-value.negative {
      color: #c62828;
    }
    .payment-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    td.mat-cell, th.mat-header-cell {
      padding: 12px 16px;
    }
    @media (max-width: 1200px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CustomerSuccessComponent implements OnInit {
  @ViewChild('paymentDialogTemplate') paymentDialogTemplate!: TemplateRef<any>;
  customerControl: FormGroup['controls']['customerId'];
  customerOptions: CustomerOption[] = [];
  customerOverview: CustomerOverview | null = null;
  selectedBill: Bill | null = null;
  billsDisplayedColumns = ['billNumber', 'issueDate', 'dueDate', 'totalAmount', 'remainingAmount', 'status', 'action'];
  billsDataSource = new MatTableDataSource<Bill>([]);
  statusHistory: StatusHistory[] = [];
  collectionRecords: CollectionRecord[] = [];
  paymentForm: FormGroup;
  paymentDialogRef: MatDialogRef<any> | null = null;

  constructor(
    private fb: FormBuilder,
    private billService: BillService,
    private collectionService: CollectionService,
    private dialog: MatDialog
  ) {
    this.customerControl = this.fb.control('');
    this.paymentForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      paymentDate: [null, Validators.required],
      paymentMethod: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit() {
    this.loadCustomerOptions();
    this.customerControl.valueChanges.subscribe(customerId => {
      if (customerId) {
        this.loadCustomerData(customerId);
      }
    });
  }

  loadCustomerOptions() {
    this.billService.getStatistics().subscribe(data => {
      if (data.customers) {
        this.customerOptions = data.customers;
      } else {
        this.customerOptions = this.getMockCustomerOptions();
      }
      if (this.customerOptions.length > 0) {
        this.customerControl.setValue(this.customerOptions[0].id);
      }
    });
  }

  loadCustomerData(customerId: string) {
    this.billService.findAll({ customerId }).subscribe(response => {
      const bills = response.data.length > 0 ? response.data : this.getMockBills(customerId);
      this.billsDataSource.data = bills;
      this.calculateOverview(bills);

      if (bills.length > 0) {
        this.loadStatusHistory(bills[0].id);
        this.loadCollectionRecords(bills[0].id);
      }
    });
  }

  calculateOverview(bills: Bill[]) {
    const totalReceivable = bills.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalPaid = bills.reduce((sum, b) => sum + b.paidAmount, 0);
    const totalOverdue = bills.filter(b => b.status === 'overdue').reduce((sum, b) => sum + b.remainingAmount, 0);

    this.customerOverview = {
      customerId: this.customerControl.value,
      customerName: this.customerOptions.find(c => c.id === this.customerControl.value)?.name || '',
      totalReceivable,
      totalPaid,
      totalOverdue,
      billCount: bills.length
    };
  }

  loadStatusHistory(billId: string) {
    this.billService.getStatusHistory(billId).subscribe(history => {
      this.statusHistory = history.length > 0 ? history : this.getMockStatusHistory();
    });
  }

  loadCollectionRecords(billId: string) {
    this.collectionService.findAllRecords({ billId }).subscribe(response => {
      this.collectionRecords = response.data.length > 0 ? response.data : this.getMockCollectionRecords();
    });
  }

  openPaymentDialog(bill: Bill) {
    this.selectedBill = bill;
    this.paymentForm.reset({
      amount: bill.remainingAmount,
      paymentDate: new Date(),
      paymentMethod: 'bank_transfer',
      notes: ''
    });
    this.paymentDialogRef = this.dialog.open(this.paymentDialogTemplate, {
      width: '520px'
    });
  }

  closePaymentDialog() {
    this.selectedBill = null;
    this.paymentDialogRef?.close();
  }

  submitPayment() {
    if (!this.paymentForm.valid || !this.selectedBill) return;

    const formValue = this.paymentForm.value;
    this.billService.recordPayment(this.selectedBill.id, {
      amount: formValue.amount,
      paymentDate: formValue.paymentDate.toISOString().split('T')[0],
      paymentMethod: formValue.paymentMethod,
      notes: formValue.notes
    }).subscribe(() => {
      this.closePaymentDialog();
      this.loadCustomerData(this.customerControl.value);
    });
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      draft: 'edit',
      issued: 'send',
      pending: 'schedule',
      partial: 'payments',
      paid: 'check_circle',
      overdue: 'warning',
      written_off: 'block',
      disputed: 'error'
    };
    return icons[status] || 'circle';
  }

  getChannelIcon(channel: string): string {
    const icons: Record<string, string> = {
      email: 'email',
      phone: 'phone',
      sms: 'sms',
      letter: 'mail',
      whatsapp: 'chat'
    };
    return icons[channel] || 'contact_mail';
  }

  getMockCustomerOptions(): CustomerOption[] {
    return [
      { id: 'cust-001', name: 'ABC科技有限公司' },
      { id: 'cust-002', name: 'XYZ贸易集团' },
      { id: 'cust-003', name: 'DEF互联网公司' },
      { id: 'cust-004', name: 'GHI制造业' },
      { id: 'cust-005', name: 'JKL服务集团' }
    ];
  }

  getMockBills(customerId: string): Bill[] {
    const bills: Record<string, Bill[]> = {
      'cust-001': [
        {
          id: 'bill-001', customerId: 'cust-001', subscriptionId: 'sub-001',
          billNumber: 'INV-2026-0601', totalAmount: 28500, paidAmount: 0, remainingAmount: 28500,
          currency: 'CNY', issueDate: '2026-06-01', dueDate: '2026-06-15', status: 'overdue',
          overdueDays: 1, lateFee: 0, interestRate: 0.05, description: '2026年6月服务费',
          createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-15T00:00:00Z'
        },
        {
          id: 'bill-002', customerId: 'cust-001', subscriptionId: 'sub-001',
          billNumber: 'INV-2026-0501', totalAmount: 28500, paidAmount: 28500, remainingAmount: 0,
          currency: 'CNY', issueDate: '2026-05-01', dueDate: '2026-05-15', status: 'paid',
          overdueDays: 0, lateFee: 0, interestRate: 0.05, description: '2026年5月服务费',
          createdAt: '2026-05-01T00:00:00Z', updatedAt: '2026-05-12T00:00:00Z'
        },
        {
          id: 'bill-003', customerId: 'cust-001', subscriptionId: 'sub-002',
          billNumber: 'INV-2026-0602', totalAmount: 56000, paidAmount: 20000, remainingAmount: 36000,
          currency: 'CNY', issueDate: '2026-06-05', dueDate: '2026-06-20', status: 'partial',
          overdueDays: 0, lateFee: 0, interestRate: 0.05, description: '企业版升级费用',
          createdAt: '2026-06-05T00:00:00Z', updatedAt: '2026-06-10T00:00:00Z'
        }
      ]
    };
    return bills[customerId] || bills['cust-001'];
  }

  getMockStatusHistory(): StatusHistory[] {
    return [
      {
        id: 'h1', billId: 'bill-001', fromStatus: 'draft', toStatus: 'issued',
        reason: '账单已出具并发送给客户', changedFields: {}, createdAt: '2026-06-01T10:00:00Z', createdBy: '系统'
      },
      {
        id: 'h2', billId: 'bill-001', fromStatus: 'issued', toStatus: 'pending',
        reason: '等待客户付款', changedFields: {}, createdAt: '2026-06-01T10:05:00Z', createdBy: '系统'
      },
      {
        id: 'h3', billId: 'bill-001', fromStatus: 'pending', toStatus: 'overdue',
        reason: '已超过付款截止日期', changedFields: {}, createdAt: '2026-06-16T00:00:00Z', createdBy: '系统'
      }
    ];
  }

  getMockCollectionRecords(): CollectionRecord[] {
    return [
      {
        id: 'cr1', billId: 'bill-001', rhythmId: 'r1', status: 'completed',
        severity: 'reminder', channel: 'email', customerResponse: '已收到，正在安排付款',
        contactDate: '2026-06-10T09:30:00Z', scheduledDate: '2026-06-10T09:00:00Z',
        promisedPaymentDate: '2026-06-18', promisedAmount: 28500,
        notes: '客户财务需要走审批流程', content: '发送逾期提醒邮件',
        conversationRecord: '', followUpActions: [], createdAt: '2026-06-10T09:30:00Z'
      },
      {
        id: 'cr2', billId: 'bill-001', rhythmId: 'r2', status: 'pending',
        severity: 'warning', channel: 'phone', customerResponse: '',
        contactDate: '', scheduledDate: '2026-06-17T14:00:00Z',
        promisedPaymentDate: '', promisedAmount: 0,
        notes: '计划明天下午电话跟进', content: '',
        conversationRecord: '', followUpActions: [], createdAt: '2026-06-16T00:00:00Z'
      }
    ];
  }
}
