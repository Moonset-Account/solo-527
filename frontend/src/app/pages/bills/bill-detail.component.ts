import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { BillService } from '../../services/bill.service';
import { Bill, StatusHistory, CollectionRecord } from '../../services/api.config';

@Component({
  selector: 'app-bill-detail',
  template: `
    <div class="bill-detail-container" *ngIf="bill">
      <div class="detail-header">
        <button mat-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          返回列表
        </button>
        <div class="header-actions">
          <button mat-raised-button color="accent" (click)="openPaymentDialog()">
            <mat-icon>payments</mat-icon>
            登记付款
          </button>
          <button mat-raised-button color="warn" (click)="openStatusDialog()">
            <mat-icon>edit</mat-icon>
            更新状态
          </button>
          <button mat-raised-button color="primary" (click)="openNoteDialog()">
            <mat-icon>note_add</mat-icon>
            添加备注
          </button>
        </div>
      </div>

      <mat-card class="info-card">
        <mat-card-title>基本信息</mat-card-title>
        <div class="info-content">
          <div class="info-row">
            <div class="info-item">
              <span class="label">账单号</span>
              <span class="value">{{ bill.billNumber }}</span>
            </div>
            <div class="info-item">
              <span class="label">状态</span>
              <span [ngClass]="bill.status | statusBadge">{{ bill.status | statusDisplay }}</span>
            </div>
            <div class="info-item">
              <span class="label">逾期天数</span>
              <span class="value" *ngIf="bill.overdueDays > 0" class="overdue">{{ bill.overdueDays }} 天</span>
              <span class="value" *ngIf="bill.overdueDays <= 0">-</span>
            </div>
          </div>
          <div class="info-row">
            <div class="info-item">
              <span class="label">客户</span>
              <span class="value">{{ bill.customer?.name || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">邮箱</span>
              <span class="value">{{ bill.customer?.email || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">电话</span>
              <span class="value">{{ bill.customer?.phone || '-' }}</span>
            </div>
          </div>
          <div class="info-row">
            <div class="info-item">
              <span class="label">订阅计划</span>
              <span class="value">{{ bill.subscription?.planName || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">出具日期</span>
              <span class="value">{{ bill.issueDate | formatDate }}</span>
            </div>
            <div class="info-item">
              <span class="label">到期日期</span>
              <span class="value">{{ bill.dueDate | formatDate }}</span>
            </div>
          </div>
          <mat-divider></mat-divider>
          <div class="amount-section">
            <h3>金额明细</h3>
            <div class="amount-row">
              <div class="amount-item">
                <span class="amount-label">账单总额</span>
                <span class="amount-value">{{ bill.totalAmount | formatCurrency:bill.currency }}</span>
              </div>
              <div class="amount-item">
                <span class="amount-label">已付金额</span>
                <span class="amount-value paid">{{ bill.paidAmount | formatCurrency:bill.currency }}</span>
              </div>
              <div class="amount-item">
                <span class="amount-label">剩余金额</span>
                <span class="amount-value" [class.overdue]="bill.remainingAmount > 0">{{ bill.remainingAmount | formatCurrency:bill.currency }}</span>
              </div>
              <div class="amount-item" *ngIf="bill.lateFee > 0">
                <span class="amount-label">滞纳金</span>
                <span class="amount-value">{{ bill.lateFee | formatCurrency:bill.currency }}</span>
              </div>
              <div class="amount-item" *ngIf="bill.interestRate > 0">
                <span class="amount-label">利率</span>
                <span class="amount-value">{{ bill.interestRate }}%</span>
              </div>
            </div>
          </div>
          <div class="description-section" *ngIf="bill.description">
            <span class="label">备注说明</span>
            <p class="value">{{ bill.description }}</p>
          </div>
        </div>
      </mat-card>

      <div class="detail-grid">
        <mat-card class="timeline-card">
          <mat-card-title>状态历史</mat-card-title>
          <div class="timeline" *ngIf="statusHistory?.length">
            <div class="timeline-item" *ngFor="let history of statusHistory; let last = last">
              <div class="timeline-marker">
                <div class="timeline-dot"></div>
                <div class="timeline-line" *ngIf="!last"></div>
              </div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span [ngClass]="history.fromStatus | statusBadge" class="status-small">{{ history.fromStatus | statusDisplay }}</span>
                  <mat-icon class="arrow-icon">arrow_forward</mat-icon>
                  <span [ngClass]="history.toStatus | statusBadge" class="status-small">{{ history.toStatus | statusDisplay }}</span>
                </div>
                <div class="timeline-meta">
                  <span class="meta-item">
                    <mat-icon>access_time</mat-icon>
                    {{ history.createdAt | formatDateTime }}
                  </span>
                  <span class="meta-item">
                    <mat-icon>person</mat-icon>
                    {{ history.createdBy }}
                  </span>
                </div>
                <p class="timeline-reason" *ngIf="history.reason">
                  <mat-icon>description</mat-icon>
                  {{ history.reason }}
                </p>
              </div>
            </div>
          </div>
          <div class="empty-state" *ngIf="!statusHistory?.length">
            <mat-icon class="empty-icon">history</mat-icon>
            <p>暂无状态变更记录</p>
          </div>
        </mat-card>

        <mat-card class="records-card">
          <mat-card-title>催收记录</mat-card-title>
          <div class="records-list" *ngIf="collectionRecords?.length">
            <mat-expansion-panel *ngFor="let record of collectionRecords">
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <span [ngClass]="record.severity | statusBadge:'severity'" class="severity-badge">{{ record.severity | statusDisplay }}</span>
                  <span class="record-channel">{{ record.channel | uppercase }}</span>
                </mat-panel-title>
                <mat-panel-description>
                  {{ record.contactDate | formatDate }}
                </mat-panel-description>
              </mat-expansion-panel-header>
              <div class="record-detail">
                <div class="detail-row">
                  <span class="detail-label">状态</span>
                  <span [ngClass]="record.status | statusBadge">{{ record.status | statusDisplay }}</span>
                </div>
                <div class="detail-row" *ngIf="record.rhythm">
                  <span class="detail-label">催收节奏</span>
                  <span class="detail-value">{{ record.rhythm.name }}</span>
                </div>
                <div class="detail-row" *ngIf="record.customerResponse">
                  <span class="detail-label">客户回应</span>
                  <span class="detail-value">{{ record.customerResponse }}</span>
                </div>
                <div class="detail-row" *ngIf="record.promisedPaymentDate">
                  <span class="detail-label">承诺付款日</span>
                  <span class="detail-value">{{ record.promisedPaymentDate | formatDate }}</span>
                </div>
                <div class="detail-row" *ngIf="record.promisedAmount">
                  <span class="detail-label">承诺金额</span>
                  <span class="detail-value">{{ record.promisedAmount | formatCurrency:bill.currency }}</span>
                </div>
                <div class="detail-row" *ngIf="record.notes">
                  <span class="detail-label">备注</span>
                  <span class="detail-value">{{ record.notes }}</span>
                </div>
                <div class="detail-row" *ngIf="record.content">
                  <span class="detail-label">内容</span>
                  <p class="detail-value">{{ record.content }}</p>
                </div>
                <div class="detail-row" *ngIf="record.followUpActions?.length">
                  <span class="detail-label">后续行动</span>
                  <ul class="follow-up-list">
                    <li *ngFor="let action of record.followUpActions">{{ action }}</li>
                  </ul>
                </div>
              </div>
            </mat-expansion-panel>
          </div>
          <div class="empty-state" *ngIf="!collectionRecords?.length">
            <mat-icon class="empty-icon">inbox</mat-icon>
            <p>暂无催收记录</p>
          </div>
        </mat-card>
      </div>

      <mat-card class="attachments-card">
        <mat-card-title>发票与附件</mat-card-title>
        <div class="attachments-grid">
          <div class="attachment-section">
            <h3>发票</h3>
            <div class="attachment-list" *ngIf="bill.invoices?.length">
              <div class="attachment-item" *ngFor="let invoice of bill.invoices">
                <mat-icon class="attachment-icon">receipt</mat-icon>
                <div class="attachment-info">
                  <span class="attachment-name">{{ invoice.name || '发票' }}</span>
                  <span class="attachment-date">{{ invoice.createdAt | formatDate }}</span>
                </div>
                <button mat-icon-button color="primary">
                  <mat-icon>download</mat-icon>
                </button>
              </div>
            </div>
            <div class="empty-small" *ngIf="!bill.invoices?.length">暂无发票</div>
          </div>
          <div class="attachment-section">
            <h3>附件</h3>
            <div class="attachment-list" *ngIf="bill.attachments?.length">
              <div class="attachment-item" *ngFor="let attachment of bill.attachments">
                <mat-icon class="attachment-icon">attach_file</mat-icon>
                <div class="attachment-info">
                  <span class="attachment-name">{{ attachment.name || '附件' }}</span>
                  <span class="attachment-date">{{ attachment.createdAt | formatDate }}</span>
                </div>
                <button mat-icon-button color="primary">
                  <mat-icon>download</mat-icon>
                </button>
              </div>
            </div>
            <div class="empty-small" *ngIf="!bill.attachments?.length">暂无附件</div>
          </div>
        </div>
      </mat-card>

      <form [formGroup]="paymentForm" *ngIf="showPaymentForm" class="action-form">
        <mat-card>
          <mat-card-title>登记付款</mat-card-title>
          <div class="form-row">
            <mat-form-field appearance="fill">
              <mat-label>付款金额</mat-label>
              <input matInput formControlName="amount" type="number" placeholder="请输入付款金额">
              <span matPrefix>{{ bill.currency }} </span>
            </mat-form-field>
            <mat-form-field appearance="fill">
              <mat-label>付款日期</mat-label>
              <input matInput [matDatepicker]="paymentDatePicker" formControlName="paymentDate">
              <mat-datepicker-toggle matSuffix [for]="paymentDatePicker"></mat-datepicker-toggle>
              <mat-datepicker #paymentDatePicker></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="fill">
              <mat-label>付款方式</mat-label>
              <mat-select formControlName="paymentMethod">
                <mat-option value="bank_transfer">银行转账</mat-option>
                <mat-option value="credit_card">信用卡</mat-option>
                <mat-option value="alipay">支付宝</mat-option>
                <mat-option value="wechat">微信支付</mat-option>
                <mat-option value="cash">现金</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>备注</mat-label>
            <textarea matInput formControlName="remark" rows="2" placeholder="请输入备注信息"></textarea>
          </mat-form-field>
          <div class="form-actions">
            <button mat-button (click)="showPaymentForm = false">取消</button>
            <button mat-raised-button color="primary" (click)="submitPayment()">确认付款</button>
          </div>
        </mat-card>
      </form>

      <form [formGroup]="statusForm" *ngIf="showStatusForm" class="action-form">
        <mat-card>
          <mat-card-title>更新状态</mat-card-title>
          <div class="form-row">
            <mat-form-field appearance="fill">
              <mat-label>新状态</mat-label>
              <mat-select formControlName="status">
                <mat-option value="draft">草稿</mat-option>
                <mat-option value="issued">已出具</mat-option>
                <mat-option value="pending">待支付</mat-option>
                <mat-option value="partial">部分支付</mat-option>
                <mat-option value="paid">已支付</mat-option>
                <mat-option value="overdue">已逾期</mat-option>
                <mat-option value="written_off">已核销</mat-option>
                <mat-option value="disputed">有争议</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>变更原因</mat-label>
            <textarea matInput formControlName="reason" rows="3" placeholder="请输入状态变更原因"></textarea>
          </mat-form-field>
          <div class="form-actions">
            <button mat-button (click)="showStatusForm = false">取消</button>
            <button mat-raised-button color="primary" (click)="submitStatus()">确认更新</button>
          </div>
        </mat-card>
      </form>

      <form [formGroup]="noteForm" *ngIf="showNoteForm" class="action-form">
        <mat-card>
          <mat-card-title>添加备注</mat-card-title>
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>备注内容</mat-label>
            <textarea matInput formControlName="note" rows="4" placeholder="请输入备注内容"></textarea>
          </mat-form-field>
          <div class="form-actions">
            <button mat-button (click)="showNoteForm = false">取消</button>
            <button mat-raised-button color="primary" (click)="submitNote()">保存备注</button>
          </div>
        </mat-card>
      </form>
    </div>

    <div class="loading-container" *ngIf="!bill">
      <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
      <p>加载中...</p>
    </div>
  `,
  styles: [`
    .bill-detail-container {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-actions {
      display: flex;
      gap: 12px;
    }
    .info-card {
      margin-bottom: 8px;
    }
    .info-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .info-row {
      display: flex;
      gap: 32px;
      flex-wrap: wrap;
    }
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 200px;
    }
    .label {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.54);
      font-weight: 500;
    }
    .value {
      font-size: 15px;
      color: rgba(0, 0, 0, 0.87);
    }
    .overdue {
      color: #f44336;
      font-weight: 500;
    }
    .amount-section {
      padding-top: 8px;
    }
    .amount-section h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
    }
    .amount-row {
      display: flex;
      gap: 32px;
      flex-wrap: wrap;
    }
    .amount-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 150px;
    }
    .amount-label {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.54);
    }
    .amount-value {
      font-size: 18px;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.87);
    }
    .amount-value.paid {
      color: #388e3c;
    }
    .amount-value.overdue {
      color: #f44336;
    }
    .description-section {
      margin-top: 8px;
    }
    .description-section p {
      margin: 8px 0 0 0;
      line-height: 1.6;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    @media (max-width: 960px) {
      .detail-grid {
        grid-template-columns: 1fr;
      }
    }
    .timeline {
      position: relative;
      padding-left: 8px;
    }
    .timeline-item {
      display: flex;
      gap: 16px;
      padding-bottom: 24px;
    }
    .timeline-marker {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .timeline-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #1976d2;
      flex-shrink: 0;
    }
    .timeline-line {
      width: 2px;
      flex: 1;
      background: #e0e0e0;
      margin-top: 4px;
    }
    .timeline-content {
      flex: 1;
      padding-bottom: 8px;
    }
    .timeline-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .arrow-icon {
      color: rgba(0, 0, 0, 0.54);
      font-size: 20px;
    }
    .status-small {
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 500;
    }
    .timeline-meta {
      display: flex;
      gap: 16px;
      margin-bottom: 8px;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
    }
    .meta-item mat-icon {
      font-size: 14px;
    }
    .timeline-reason {
      margin: 0;
      font-size: 13px;
      color: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: flex-start;
      gap: 4px;
      line-height: 1.5;
    }
    .timeline-reason mat-icon {
      font-size: 14px;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .records-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .record-channel {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .severity-badge {
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 500;
      margin-right: 8px;
    }
    .severity-reminder {
      background: #e3f2fd;
      color: #1976d2;
    }
    .severity-warning {
      background: #fff3e0;
      color: #f57c00;
    }
    .severity-urgent {
      background: #ffebee;
      color: #d32f2f;
    }
    .severity-legal {
      background: #f3e5f5;
      color: #7b1fa2;
    }
    .record-detail {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 8px 0;
    }
    .detail-row {
      display: flex;
      gap: 16px;
    }
    .detail-label {
      min-width: 100px;
      font-size: 13px;
      color: rgba(0, 0, 0, 0.54);
      flex-shrink: 0;
    }
    .detail-value {
      flex: 1;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.87);
    }
    .follow-up-list {
      margin: 0;
      padding-left: 20px;
    }
    .follow-up-list li {
      margin-bottom: 4px;
    }
    .attachments-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
    }
    @media (max-width: 768px) {
      .attachments-grid {
        grid-template-columns: 1fr;
      }
    }
    .attachment-section h3 {
      margin: 0 0 16px 0;
      font-size: 15px;
      font-weight: 600;
    }
    .attachment-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .attachment-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #fafafa;
      border-radius: 8px;
    }
    .attachment-icon {
      color: #1976d2;
    }
    .attachment-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .attachment-name {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.87);
    }
    .attachment-date {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      color: rgba(0, 0, 0, 0.54);
    }
    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .empty-small {
      color: rgba(0, 0, 0, 0.54);
      font-size: 14px;
      text-align: center;
      padding: 24px;
    }
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      gap: 16px;
      color: rgba(0, 0, 0, 0.54);
    }
    .action-form {
      margin-top: 8px;
    }
    .form-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .form-row mat-form-field {
      flex: 1;
      min-width: 200px;
    }
    .full-width {
      width: 100%;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 16px;
    }
    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      display: inline-block;
    }
    .status-draft {
      background: #e0e0e0;
      color: #616161;
    }
    .status-issued {
      background: #e3f2fd;
      color: #1976d2;
    }
    .status-pending {
      background: #fff3e0;
      color: #f57c00;
    }
    .status-partial {
      background: #fff8e1;
      color: #fbc02d;
    }
    .status-paid {
      background: #e8f5e9;
      color: #388e3c;
    }
    .status-overdue {
      background: #ffebee;
      color: #d32f2f;
    }
    .status-written-off {
      background: #f3e5f5;
      color: #7b1fa2;
    }
    .status-disputed {
      background: #ffe0b2;
      color: #e65100;
    }
    .mat-expansion-panel {
      margin: 0 !important;
    }
  `]
})
export class BillDetailComponent implements OnInit {
  bill!: Bill;
  statusHistory: StatusHistory[] = [];
  collectionRecords: CollectionRecord[] = [];
  showPaymentForm = false;
  showStatusForm = false;
  showNoteForm = false;

  paymentForm: FormGroup;
  statusForm: FormGroup;
  noteForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private billService: BillService,
    private dialog: MatDialog
  ) {
    this.paymentForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      paymentDate: [new Date(), Validators.required],
      paymentMethod: ['bank_transfer', Validators.required],
      remark: [''],
    });

    this.statusForm = this.fb.group({
      status: ['', Validators.required],
      reason: ['', Validators.required],
    });

    this.noteForm = this.fb.group({
      note: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    const billId = this.route.snapshot.paramMap.get('id');
    if (billId) {
      this.loadBillDetail(billId);
    }
  }

  loadBillDetail(id: string): void {
    this.billService.findOne(id).subscribe({
      next: (bill) => {
        this.bill = bill;
        this.statusHistory = bill.statusHistory || [];
        this.collectionRecords = bill.collectionRecords || [];
      },
      error: (error) => {
        console.error('Failed to load bill detail:', error);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/bills']);
  }

  openPaymentDialog(): void {
    this.showPaymentForm = true;
    this.showStatusForm = false;
    this.showNoteForm = false;
  }

  openStatusDialog(): void {
    this.showStatusForm = true;
    this.showPaymentForm = false;
    this.showNoteForm = false;
    this.statusForm.patchValue({ status: this.bill.status });
  }

  openNoteDialog(): void {
    this.showNoteForm = true;
    this.showPaymentForm = false;
    this.showStatusForm = false;
  }

  submitPayment(): void {
    if (this.paymentForm.valid) {
      this.billService.recordPayment(this.bill.id, this.paymentForm.value).subscribe({
        next: (updatedBill) => {
          this.bill = updatedBill;
          this.showPaymentForm = false;
          this.paymentForm.reset({
            amount: null,
            paymentDate: new Date(),
            paymentMethod: 'bank_transfer',
            remark: '',
          });
        },
        error: (error) => {
          console.error('Failed to record payment:', error);
        }
      });
    }
  }

  submitStatus(): void {
    if (this.statusForm.valid) {
      const { status, reason } = this.statusForm.value;
      this.billService.updateStatus(this.bill.id, status, reason).subscribe({
        next: (updatedBill) => {
          this.bill = updatedBill;
          this.statusHistory = updatedBill.statusHistory || [];
          this.showStatusForm = false;
          this.statusForm.reset({ status: '', reason: '' });
        },
        error: (error) => {
          console.error('Failed to update status:', error);
        }
      });
    }
  }

  submitNote(): void {
    if (this.noteForm.valid) {
      console.log('Add note:', this.noteForm.value);
      this.showNoteForm = false;
      this.noteForm.reset();
    }
  }
}
