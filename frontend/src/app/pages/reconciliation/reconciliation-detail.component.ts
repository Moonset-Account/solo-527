import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReconciliationService } from '../../services/reconciliation.service';
import { AttachmentService } from '../../services/attachment.service';
import { BillService } from '../../services/bill.service';
import { CollectionService } from '../../services/collection.service';
import { CashForecastService } from '../../services/cash-forecast.service';
import { InvoiceService } from '../../services/invoice.service';
import { Reconciliation, Attachment, Bill, CollectionRecord, CashForecast, Invoice } from '../../services/api.config';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-reconciliation-detail',
  template: `
    <div class="detail-container" *ngIf="reconciliation">
      <div class="page-header">
        <div class="header-left">
          <button mat-icon-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="header-info">
            <h2>对账详情 - {{ reconciliation.period }}</h2>
            <span [class]="reconciliation.status | statusBadge" class="status-badge-lg">
              {{ reconciliation.status | statusDisplay }}
            </span>
          </div>
        </div>
        <div class="header-right">
          <button 
            mat-raised-button 
            color="primary" 
            *ngIf="reconciliation.status === 'in_progress'"
            (click)="confirmComplete()"
          >
            <mat-icon>check</mat-icon>
            确认对账完成
          </button>
        </div>
      </div>

      <mat-tab-group class="detail-tabs">
        <mat-tab label="概览">
          <div class="tab-content">
            <div class="overview-grid">
              <mat-card class="info-card">
                <mat-card-header>
                  <mat-card-title>基本信息</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="info-list">
                    <div class="info-item">
                      <span class="label">对账周期</span>
                      <span class="value">{{ reconciliation.period }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">周期开始</span>
                      <span class="value">{{ reconciliation.periodStartDate | formatDate }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">周期结束</span>
                      <span class="value">{{ reconciliation.periodEndDate | formatDate }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">创建时间</span>
                      <span class="value">{{ reconciliation.createdAt | formatDateTime }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">当前状态</span>
                      <span [class]="reconciliation.status | statusBadge">
                        {{ reconciliation.status | statusDisplay }}
                      </span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card class="info-card">
                <mat-card-header>
                  <mat-card-title>差异汇总</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="summary-list">
                    <div class="summary-item">
                      <span class="label">系统账单总额</span>
                      <span class="value">{{ reconciliation.systemBillsTotal | formatCurrency }}</span>
                    </div>
                    <div class="summary-item">
                      <span class="label">银行到账总额</span>
                      <span class="value">{{ reconciliation.bankDepositsTotal | formatCurrency }}</span>
                    </div>
                    <div class="summary-item total">
                      <span class="label">差异总额</span>
                      <span class="value" [class.positive]="reconciliation.totalVariance > 0" [class.negative]="reconciliation.totalVariance < 0">
                        {{ reconciliation.totalVariance | formatCurrency }}
                      </span>
                    </div>
                    <div class="summary-item">
                      <span class="label">已对账差异</span>
                      <span class="value success">{{ reconciliation.reconciledVariance | formatCurrency }}</span>
                    </div>
                    <div class="summary-item">
                      <span class="label">未对账差异</span>
                      <span class="value warning">{{ reconciliation.unreconciledVariance | formatCurrency }}</span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card class="info-card">
                <mat-card-header>
                  <mat-card-title>状态流转</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="status-timeline">
                    <div class="timeline-item completed">
                      <div class="timeline-dot"></div>
                      <div class="timeline-content">
                        <div class="timeline-title">创建草稿</div>
                        <div class="timeline-date">{{ reconciliation.createdAt | formatDateTime }}</div>
                      </div>
                    </div>
                    <div class="timeline-item" [class.completed]="reconciliation.status !== 'draft'">
                      <div class="timeline-dot"></div>
                      <div class="timeline-content">
                        <div class="timeline-title">开始对账</div>
                        <div class="timeline-date">{{ reconciliation.status !== 'draft' ? reconciliation.createdAt | formatDateTime : '待处理' }}</div>
                      </div>
                    </div>
                    <div class="timeline-item" [class.completed]="reconciliation.status === 'reconciled' || reconciliation.status === 'finalized'">
                      <div class="timeline-dot"></div>
                      <div class="timeline-content">
                        <div class="timeline-title">对账完成</div>
                        <div class="timeline-date">{{ reconciliation.status === 'reconciled' || reconciliation.status === 'finalized' ? reconciliation.createdAt | formatDateTime : '待处理' }}</div>
                      </div>
                    </div>
                    <div class="timeline-item" [class.completed]="reconciliation.status === 'finalized'">
                      <div class="timeline-dot"></div>
                      <div class="timeline-content">
                        <div class="timeline-title">已确认</div>
                        <div class="timeline-date">{{ reconciliation.status === 'finalized' ? reconciliation.createdAt | formatDateTime : '待处理' }}</div>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="已匹配">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>已匹配记录 ({{ reconciliation.matchedItems?.length || 0 }})</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="table-container">
                  <table mat-table [dataSource]="matchedDataSource" class="data-table">
                    <ng-container matColumnDef="billNumber">
                      <th mat-header-cell *matHeaderCellDef>账单编号</th>
                      <td mat-cell *matCellDef="let element">{{ element.billNumber }}</td>
                    </ng-container>
                    <ng-container matColumnDef="billAmount">
                      <th mat-header-cell *matHeaderCellDef>账单金额</th>
                      <td mat-cell *matCellDef="let element">{{ element.billAmount | formatCurrency }}</td>
                    </ng-container>
                    <ng-container matColumnDef="bankReference">
                      <th mat-header-cell *matHeaderCellDef>银行流水号</th>
                      <td mat-cell *matCellDef="let element">{{ element.bankReference }}</td>
                    </ng-container>
                    <ng-container matColumnDef="bankAmount">
                      <th mat-header-cell *matHeaderCellDef>到账金额</th>
                      <td mat-cell *matCellDef="let element">{{ element.bankAmount | formatCurrency }}</td>
                    </ng-container>
                    <ng-container matColumnDef="matchDate">
                      <th mat-header-cell *matHeaderCellDef>匹配日期</th>
                      <td mat-cell *matCellDef="let element">{{ element.matchDate | formatDate }}</td>
                    </ng-container>
                    <ng-container matColumnDef="matchedBy">
                      <th mat-header-cell *matHeaderCellDef>匹配方式</th>
                      <td mat-cell *matCellDef="let element">{{ element.matchedBy }}</td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="matchedColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: matchedColumns;"></tr>
                  </table>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="未匹配">
          <div class="tab-content">
            <div class="unmatched-grid">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>未匹配账单 ({{ reconciliation.unmatchedBills || 0 }})</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="table-container">
                    <table mat-table [dataSource]="unmatchedBillsDataSource" class="data-table">
                      <ng-container matColumnDef="billNumber">
                        <th mat-header-cell *matHeaderCellDef>账单编号</th>
                        <td mat-cell *matCellDef="let element">{{ element.billNumber }}</td>
                      </ng-container>
                      <ng-container matColumnDef="customer">
                        <th mat-header-cell *matHeaderCellDef>客户</th>
                        <td mat-cell *matCellDef="let element">{{ element.customer }}</td>
                      </ng-container>
                      <ng-container matColumnDef="amount">
                        <th mat-header-cell *matHeaderCellDef>金额</th>
                        <td mat-cell *matCellDef="let element">{{ element.amount | formatCurrency }}</td>
                      </ng-container>
                      <ng-container matColumnDef="dueDate">
                        <th mat-header-cell *matHeaderCellDef>到期日</th>
                        <td mat-cell *matCellDef="let element">{{ element.dueDate | formatDate }}</td>
                      </ng-container>
                      <ng-container matColumnDef="reason">
                        <th mat-header-cell *matHeaderCellDef>未匹配原因</th>
                        <td mat-cell *matCellDef="let element">{{ element.reason }}</td>
                      </ng-container>
                      <tr mat-header-row *matHeaderRowDef="unmatchedBillColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: unmatchedBillColumns;"></tr>
                    </table>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card>
                <mat-card-header>
                  <mat-card-title>未匹配银行记录</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="table-container">
                    <table mat-table [dataSource]="unmatchedBankDataSource" class="data-table">
                      <ng-container matColumnDef="reference">
                        <th mat-header-cell *matHeaderCellDef>流水号</th>
                        <td mat-cell *matCellDef="let element">{{ element.reference }}</td>
                      </ng-container>
                      <ng-container matColumnDef="amount">
                        <th mat-header-cell *matHeaderCellDef>金额</th>
                        <td mat-cell *matCellDef="let element">{{ element.amount | formatCurrency }}</td>
                      </ng-container>
                      <ng-container matColumnDef="date">
                        <th mat-header-cell *matHeaderCellDef>到账日期</th>
                        <td mat-cell *matCellDef="let element">{{ element.date | formatDate }}</td>
                      </ng-container>
                      <ng-container matColumnDef="payer">
                        <th mat-header-cell *matHeaderCellDef>付款方</th>
                        <td mat-cell *matCellDef="let element">{{ element.payer }}</td>
                      </ng-container>
                      <ng-container matColumnDef="reason">
                        <th mat-header-cell *matHeaderCellDef>未匹配原因</th>
                        <td mat-cell *matCellDef="let element">{{ element.reason }}</td>
                      </ng-container>
                      <tr mat-header-row *matHeaderRowDef="unmatchedBankColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: unmatchedBankColumns;"></tr>
                    </table>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="差异分解">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>差异明细分类</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="variance-accordion">
                  <mat-expansion-panel *ngFor="let group of varianceGroups">
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        <mat-icon class="variance-icon">{{ group.icon }}</mat-icon>
                        {{ group.name }}
                      </mat-panel-title>
                      <mat-panel-description>
                        <span [class]="group.amount > 0 ? 'positive' : 'negative'">
                          {{ group.amount | formatCurrency }}
                        </span>
                        <span class="count-badge">{{ group.items?.length || 0 }} 笔</span>
                      </mat-panel-description>
                    </mat-expansion-panel-header>
                    <div class="table-container">
                      <table mat-table [dataSource]="group.dataSource" class="data-table">
                        <ng-container matColumnDef="type">
                          <th mat-header-cell *matHeaderCellDef>类型</th>
                          <td mat-cell *matCellDef="let element">{{ element.type }}</td>
                        </ng-container>
                        <ng-container matColumnDef="description">
                          <th mat-header-cell *matHeaderCellDef>描述</th>
                          <td mat-cell *matCellDef="let element">{{ element.description }}</td>
                        </ng-container>
                        <ng-container matColumnDef="amount">
                          <th mat-header-cell *matHeaderCellDef>金额</th>
                          <td mat-cell *matCellDef="let element" [class.positive]="element.amount > 0" [class.negative]="element.amount < 0">
                            {{ element.amount | formatCurrency }}
                          </td>
                        </ng-container>
                        <ng-container matColumnDef="date">
                          <th mat-header-cell *matHeaderCellDef>日期</th>
                          <td mat-cell *matCellDef="let element">{{ element.date | formatDate }}</td>
                        </ng-container>
                        <ng-container matColumnDef="status">
                          <th mat-header-cell *matHeaderCellDef>状态</th>
                          <td mat-cell *matCellDef="let element">
                            <span [class]="element.status | statusBadge">
                              {{ element.status | statusDisplay }}
                            </span>
                          </td>
                        </ng-container>
                        <tr mat-header-row *matHeaderRowDef="varianceColumns"></tr>
                        <tr mat-row *matRowDef="let row; columns: varianceColumns;"></tr>
                      </table>
                    </div>
                  </mat-expansion-panel>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="关联记录">
          <div class="tab-content">
            <div class="linked-records-grid" *ngIf="isLoadingLinkedRecords">
              <mat-card>
                <mat-card-content class="loading-content">
                  <mat-spinner diameter="40"></mat-spinner>
                  <p>加载关联记录中...</p>
                </mat-card-content>
              </mat-card>
            </div>

            <div class="linked-records-grid" *ngIf="!isLoadingLinkedRecords">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>关联账单 ({{ linkedBillsDataSource.data.length }})</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="table-container">
                    <table mat-table [dataSource]="linkedBillsDataSource" class="data-table">
                      <ng-container matColumnDef="billNumber">
                        <th mat-header-cell *matHeaderCellDef>账单编号</th>
                        <td mat-cell *matCellDef="let element">{{ element.billNumber }}</td>
                      </ng-container>
                      <ng-container matColumnDef="customerName">
                        <th mat-header-cell *matHeaderCellDef>客户名称</th>
                        <td mat-cell *matCellDef="let element">{{ element.customer?.name || '-' }}</td>
                      </ng-container>
                      <ng-container matColumnDef="amount">
                        <th mat-header-cell *matHeaderCellDef>金额</th>
                        <td mat-cell *matCellDef="let element">{{ element.totalAmount | formatCurrency }}</td>
                      </ng-container>
                      <ng-container matColumnDef="status">
                        <th mat-header-cell *matHeaderCellDef>状态</th>
                        <td mat-cell *matCellDef="let element">
                          <span [class]="element.status | statusBadge">
                            {{ element.status | statusDisplay }}
                          </span>
                        </td>
                      </ng-container>
                      <ng-container matColumnDef="dueDate">
                        <th mat-header-cell *matHeaderCellDef>到期日</th>
                        <td mat-cell *matCellDef="let element">{{ element.dueDate | formatDate }}</td>
                      </ng-container>
                      <tr mat-header-row *matHeaderRowDef="linkedBillColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: linkedBillColumns;"></tr>
                    </table>
                    <div class="empty-table" *ngIf="linkedBillsDataSource.data.length === 0">
                      暂无关联账单
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card>
                <mat-card-header>
                  <mat-card-title>关联现金预测 ({{ linkedForecastsDataSource.data.length }})</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="table-container">
                    <table mat-table [dataSource]="linkedForecastsDataSource" class="data-table">
                      <ng-container matColumnDef="forecastPeriod">
                        <th mat-header-cell *matHeaderCellDef>预测周期</th>
                        <td mat-cell *matCellDef="let element">{{ element.forecastPeriod }}</td>
                      </ng-container>
                      <ng-container matColumnDef="projectedCashGap">
                        <th mat-header-cell *matHeaderCellDef>预计现金缺口</th>
                        <td mat-cell *matCellDef="let element" [class.negative]="element.projectedCashGap > 0">
                          {{ element.projectedCashGap | formatCurrency }}
                        </td>
                      </ng-container>
                      <ng-container matColumnDef="status">
                        <th mat-header-cell *matHeaderCellDef>状态</th>
                        <td mat-cell *matCellDef="let element">
                          <span [class]="element.status | statusBadge">
                            {{ element.status | statusDisplay }}
                          </span>
                        </td>
                      </ng-container>
                      <tr mat-header-row *matHeaderRowDef="linkedForecastColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: linkedForecastColumns;"></tr>
                    </table>
                    <div class="empty-table" *ngIf="linkedForecastsDataSource.data.length === 0">
                      暂无关联现金预测
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card>
                <mat-card-header>
                  <mat-card-title>关联催收记录 ({{ linkedCollectionsDataSource.data.length }})</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="table-container">
                    <table mat-table [dataSource]="linkedCollectionsDataSource" class="data-table">
                      <ng-container matColumnDef="channel">
                        <th mat-header-cell *matHeaderCellDef>催收渠道</th>
                        <td mat-cell *matCellDef="let element">{{ element.channel }}</td>
                      </ng-container>
                      <ng-container matColumnDef="severity">
                        <th mat-header-cell *matHeaderCellDef>严重程度</th>
                        <td mat-cell *matCellDef="let element">
                          <span [class]="'severity-' + element.severity">
                            {{ element.severity }}
                          </span>
                        </td>
                      </ng-container>
                      <ng-container matColumnDef="status">
                        <th mat-header-cell *matHeaderCellDef>状态</th>
                        <td mat-cell *matCellDef="let element">
                          <span [class]="element.status | statusBadge">
                            {{ element.status | statusDisplay }}
                          </span>
                        </td>
                      </ng-container>
                      <ng-container matColumnDef="contactDate">
                        <th mat-header-cell *matHeaderCellDef>联系日期</th>
                        <td mat-cell *matCellDef="let element">{{ element.contactDate | formatDate }}</td>
                      </ng-container>
                      <tr mat-header-row *matHeaderRowDef="linkedCollectionColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: linkedCollectionColumns;"></tr>
                    </table>
                    <div class="empty-table" *ngIf="linkedCollectionsDataSource.data.length === 0">
                      暂无关联催收记录
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card>
                <mat-card-header>
                  <mat-card-title>关联发票 ({{ linkedInvoicesDataSource.data.length }})</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="table-container">
                    <table mat-table [dataSource]="linkedInvoicesDataSource" class="data-table">
                      <ng-container matColumnDef="invoiceNumber">
                        <th mat-header-cell *matHeaderCellDef>发票编号</th>
                        <td mat-cell *matCellDef="let element">{{ element.invoiceNumber }}</td>
                      </ng-container>
                      <ng-container matColumnDef="amount">
                        <th mat-header-cell *matHeaderCellDef>金额</th>
                        <td mat-cell *matCellDef="let element">{{ element.amount | formatCurrency }}</td>
                      </ng-container>
                      <ng-container matColumnDef="status">
                        <th mat-header-cell *matHeaderCellDef>状态</th>
                        <td mat-cell *matCellDef="let element">
                          <span [class]="element.status | statusBadge">
                            {{ element.status | statusDisplay }}
                          </span>
                        </td>
                      </ng-container>
                      <ng-container matColumnDef="invoiceDate">
                        <th mat-header-cell *matHeaderCellDef>开票日期</th>
                        <td mat-cell *matCellDef="let element">{{ element.invoiceDate | formatDate }}</td>
                      </ng-container>
                      <tr mat-header-row *matHeaderRowDef="linkedInvoiceColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: linkedInvoiceColumns;"></tr>
                    </table>
                    <div class="empty-table" *ngIf="linkedInvoicesDataSource.data.length === 0">
                      暂无关联发票
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card>
                <mat-card-header>
                  <mat-card-title>附件列表 ({{ linkedAttachmentsDataSource.data.length }})</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="table-container">
                    <table mat-table [dataSource]="linkedAttachmentsDataSource" class="data-table">
                      <ng-container matColumnDef="originalName">
                        <th mat-header-cell *matHeaderCellDef>文件名</th>
                        <td mat-cell *matCellDef="let element">
                          <mat-icon class="record-icon">attach_file</mat-icon>
                          {{ element.originalName }}
                        </td>
                      </ng-container>
                      <ng-container matColumnDef="size">
                        <th mat-header-cell *matHeaderCellDef>大小</th>
                        <td mat-cell *matCellDef="let element">{{ formatFileSize(element.size) }}</td>
                      </ng-container>
                      <ng-container matColumnDef="description">
                        <th mat-header-cell *matHeaderCellDef>描述</th>
                        <td mat-cell *matCellDef="let element">{{ element.description || '-' }}</td>
                      </ng-container>
                      <ng-container matColumnDef="download">
                        <th mat-header-cell *matHeaderCellDef>操作</th>
                        <td mat-cell *matCellDef="let element">
                          <button mat-icon-button (click)="downloadAttachment(element)" matTooltip="下载">
                            <mat-icon>download</mat-icon>
                          </button>
                        </td>
                      </ng-container>
                      <tr mat-header-row *matHeaderRowDef="linkedAttachmentColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: linkedAttachmentColumns;"></tr>
                    </table>
                    <div class="empty-table" *ngIf="linkedAttachmentsDataSource.data.length === 0">
                      暂无附件
                    </div>
                  </div>

                  <div class="upload-section">
                    <h4>上传附件</h4>
                    <div class="upload-form">
                      <input type="file" #attachmentInput (change)="onAttachmentSelected($event)" style="display: none;">
                      <mat-form-field appearance="outline" class="description-input">
                        <mat-label>附件描述</mat-label>
                        <input matInput [(ngModel)]="uploadDescription" placeholder="可选">
                      </mat-form-field>
                      <button mat-stroked-button (click)="attachmentInput.click()" [disabled]="isUploading">
                        <mat-icon>attach_file</mat-icon>
                        选择文件
                      </button>
                      <span *ngIf="selectedFile" class="file-name">{{ selectedFile.name }}</span>
                      <button mat-raised-button color="primary" (click)="uploadAttachment()" [disabled]="!selectedFile || isUploading">
                        <mat-icon *ngIf="!isUploading">cloud_upload</mat-icon>
                        <mat-spinner *ngIf="isUploading" diameter="20"></mat-spinner>
                        {{ isUploading ? '上传中...' : '上传' }}
                      </button>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card>
                <mat-card-header>
                  <mat-card-title>备注</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="notes-section">
                    <div class="current-notes" *ngIf="reconciliation.notes">
                      <h4>当前备注</h4>
                      <p class="notes-content">{{ reconciliation.notes }}</p>
                    </div>

                    <form [formGroup]="noteForm" (ngSubmit)="saveNotes()" class="add-note-form">
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>添加/更新备注</mat-label>
                        <textarea matInput formControlName="content" rows="4" placeholder="请输入备注内容..."></textarea>
                      </mat-form-field>
                      <div class="form-actions">
                        <button type="submit" mat-raised-button color="primary" [disabled]="!noteForm.valid || isSavingNotes">
                          <mat-icon *ngIf="!isSavingNotes">save</mat-icon>
                          <mat-spinner *ngIf="isSavingNotes" diameter="20"></mat-spinner>
                          {{ isSavingNotes ? '保存中...' : '保存备注' }}
                        </button>
                      </div>
                    </form>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .detail-container {
      padding: 24px;
      max-width: 1600px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-info h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }

    .status-badge-lg {
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      display: inline-block;
    }

    .detail-tabs {
      background: white;
      border-radius: 8px;
      overflow: hidden;
    }

    ::ng-deep .mat-mdc-tab-header {
      background: #f5f5f5;
    }

    .tab-content {
      padding: 24px;
    }

    .overview-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .info-card {
      border-radius: 8px;
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .info-item .label {
      color: rgba(0, 0, 0, 0.54);
      font-size: 14px;
    }

    .info-item .value {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
    }

    .summary-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }

    .summary-item:last-child {
      border-bottom: none;
    }

    .summary-item.total {
      padding-top: 12px;
      border-top: 2px solid rgba(0, 0, 0, 0.1);
      border-bottom: none;
    }

    .summary-item .label {
      color: rgba(0, 0, 0, 0.54);
      font-size: 14px;
    }

    .summary-item .value {
      font-weight: 600;
      font-size: 16px;
    }

    .summary-item .value.success {
      color: #4caf50;
    }

    .summary-item .value.warning {
      color: #ff9800;
    }

    .positive {
      color: #4caf50;
      font-weight: 600;
    }

    .negative {
      color: #f44336;
      font-weight: 600;
    }

    .status-timeline {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .timeline-item {
      display: flex;
      gap: 12px;
      position: relative;
      padding-bottom: 24px;
    }

    .timeline-item:last-child {
      padding-bottom: 0;
    }

    .timeline-item:not(:last-child)::before {
      content: '';
      position: absolute;
      left: 11px;
      top: 24px;
      width: 2px;
      height: calc(100% - 24px);
      background: #e0e0e0;
    }

    .timeline-item.completed:not(:last-child)::before {
      background: #4caf50;
    }

    .timeline-dot {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #e0e0e0;
      border: 4px solid white;
      box-shadow: 0 0 0 2px #e0e0e0;
      flex-shrink: 0;
      z-index: 1;
    }

    .timeline-item.completed .timeline-dot {
      background: #4caf50;
      box-shadow: 0 0 0 2px #4caf50;
    }

    .timeline-content {
      flex: 1;
    }

    .timeline-title {
      font-weight: 600;
      color: rgba(0, 0, 0, 0.87);
    }

    .timeline-date {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
      margin-top: 2px;
    }

    .table-container {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      min-width: 600px;
    }

    ::ng-deep th.mat-header-cell {
      font-weight: 600;
      color: rgba(0, 0, 0, 0.87);
      background: #fafafa;
    }

    ::ng-deep td.mat-cell {
      padding: 12px 16px;
    }

    .unmatched-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .linked-records-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .record-icon {
      vertical-align: middle;
      margin-right: 8px;
      font-size: 20px;
    }

    .variance-accordion {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .variance-icon {
      margin-right: 8px;
      color: #1976d2;
    }

    .count-badge {
      background: rgba(0, 0, 0, 0.06);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      margin-left: 8px;
    }

    .notes-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .note-item {
      padding: 16px;
      background: #fafafa;
      border-radius: 8px;
    }

    .note-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .note-icon {
      color: #1976d2;
      font-size: 20px;
    }

    .note-title {
      font-weight: 600;
      flex: 1;
    }

    .note-date {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
    }

    .note-content {
      color: rgba(0, 0, 0, 0.87);
      line-height: 1.6;
    }

    .add-note-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .form-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .file-name {
      color: rgba(0, 0, 0, 0.54);
      font-size: 14px;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-draft {
      background: rgba(158, 158, 158, 0.1);
      color: #9e9e9e;
    }

    .status-in-progress {
      background: rgba(33, 150, 243, 0.1);
      color: #2196f3;
    }

    .status-reconciled {
      background: rgba(76, 175, 80, 0.1);
      color: #4caf50;
    }

    .status-finalized {
      background: rgba(156, 39, 176, 0.1);
      color: #9c27b0;
    }

    .status-paid {
      background: rgba(76, 175, 80, 0.1);
      color: #4caf50;
    }

    .status-pending {
      background: rgba(255, 152, 0, 0.1);
      color: #ff9800;
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      gap: 16px;
    }

    .empty-table {
      text-align: center;
      padding: 24px;
      color: rgba(0, 0, 0, 0.54);
    }

    .upload-section {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid rgba(0, 0, 0, 0.06);
    }

    .upload-section h4 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
    }

    .upload-form {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .description-input {
      flex: 1;
      min-width: 200px;
    }

    .current-notes {
      margin-bottom: 24px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .current-notes h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.54);
    }

    .notes-content {
      margin: 0;
      line-height: 1.6;
      color: rgba(0, 0, 0, 0.87);
    }

    .severity-low {
      color: #4caf50;
      font-weight: 500;
    }

    .severity-medium {
      color: #ff9800;
      font-weight: 500;
    }

    .severity-high {
      color: #f44336;
      font-weight: 500;
    }

    .severity-critical {
      color: #9c27b0;
      font-weight: 500;
    }

    @media (max-width: 1200px) {
      .overview-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 600px) {
      .page-header {
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
      }

      .header-info {
        flex-direction: column;
        align-items: flex-start;
      }

      .form-actions {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class ReconciliationDetailComponent implements OnInit, OnDestroy {
  reconciliation!: Reconciliation;
  selectedFile: File | null = null;
  isLoadingLinkedRecords = false;
  isUploading = false;
  isSavingNotes = false;
  uploadDescription = '';

  noteForm: FormGroup;

  matchedColumns = ['billNumber', 'billAmount', 'bankReference', 'bankAmount', 'matchDate', 'matchedBy'];
  unmatchedBillColumns = ['billNumber', 'customer', 'amount', 'dueDate', 'reason'];
  unmatchedBankColumns = ['reference', 'amount', 'date', 'payer', 'reason'];
  varianceColumns = ['type', 'description', 'amount', 'date', 'status'];
  linkedBillColumns = ['billNumber', 'customerName', 'amount', 'status', 'dueDate'];
  linkedForecastColumns = ['forecastPeriod', 'projectedCashGap', 'status'];
  linkedCollectionColumns = ['channel', 'severity', 'status', 'contactDate'];
  linkedInvoiceColumns = ['invoiceNumber', 'amount', 'status', 'invoiceDate'];
  linkedAttachmentColumns = ['originalName', 'size', 'description', 'download'];

  matchedDataSource = new MatTableDataSource<any>([]);
  unmatchedBillsDataSource = new MatTableDataSource<any>([]);
  unmatchedBankDataSource = new MatTableDataSource<any>([]);
  linkedBillsDataSource = new MatTableDataSource<Bill>([]);
  linkedForecastsDataSource = new MatTableDataSource<CashForecast>([]);
  linkedCollectionsDataSource = new MatTableDataSource<CollectionRecord>([]);
  linkedInvoicesDataSource = new MatTableDataSource<Invoice>([]);
  linkedAttachmentsDataSource = new MatTableDataSource<Attachment>([]);

  varianceGroups: any[] = [];
  notes: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private reconciliationService: ReconciliationService,
    private attachmentService: AttachmentService,
    private billService: BillService,
    private collectionService: CollectionService,
    private cashForecastService: CashForecastService,
    private invoiceService: InvoiceService,
    private snackBar: MatSnackBar
  ) {
    this.noteForm = this.fb.group({
      content: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadReconciliation(id);
      this.loadLinkedRecords(id);
    }
  }

  ngOnDestroy(): void {}

  loadReconciliation(id: string): void {
    this.reconciliationService.findOne(id).subscribe({
      next: (data) => {
        this.reconciliation = data;
        this.matchedDataSource.data = data.matchedItems || [];
        this.unmatchedBillsDataSource.data = this.generateUnmatchedBills();
        this.unmatchedBankDataSource.data = this.generateUnmatchedBankRecords();
        this.varianceGroups = this.generateVarianceGroups(data.varianceBreakdown || []);
        if (data.notes) {
          this.noteForm.patchValue({ content: data.notes });
        }
      },
      error: (error) => {
        this.snackBar.open('加载对账详情失败: ' + (error.message || '未知错误'), '关闭', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  loadLinkedRecords(id: string): void {
    this.isLoadingLinkedRecords = true;
    this.reconciliationService.getLinkedRecords(id).pipe(
      finalize(() => this.isLoadingLinkedRecords = false)
    ).subscribe({
      next: (data) => {
        this.linkedBillsDataSource.data = data.bills || [];
        this.linkedForecastsDataSource.data = data.cashForecasts || [];
        this.linkedCollectionsDataSource.data = data.collectionRecords || [];
        this.linkedInvoicesDataSource.data = data.invoices || [];
        this.linkedAttachmentsDataSource.data = data.attachments || [];
      },
      error: (error) => {
        this.snackBar.open('加载关联记录失败: ' + (error.message || '未知错误'), '关闭', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.linkedBillsDataSource.data = [];
        this.linkedForecastsDataSource.data = [];
        this.linkedCollectionsDataSource.data = [];
        this.linkedInvoicesDataSource.data = [];
        this.linkedAttachmentsDataSource.data = [];
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/reconciliation']);
  }

  confirmComplete(): void {
    if (this.reconciliation) {
      this.reconciliationService.updateStatus(this.reconciliation.id, 'completed').subscribe({
        next: () => {
          this.loadReconciliation(this.reconciliation.id);
          this.snackBar.open('对账已完成', '关闭', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          this.snackBar.open('确认完成失败: ' + (error.message || '未知错误'), '关闭', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  saveNotes(): void {
    if (!this.noteForm.valid || !this.reconciliation) return;

    this.isSavingNotes = true;
    const notes = this.noteForm.value.content;
    this.reconciliationService.updateStatus(this.reconciliation.id, this.reconciliation.status, notes).pipe(
      finalize(() => this.isSavingNotes = false)
    ).subscribe({
      next: (data) => {
        this.reconciliation = data;
        this.snackBar.open('备注保存成功', '关闭', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        this.snackBar.open('保存备注失败: ' + (error.message || '未知错误'), '关闭', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onAttachmentSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadAttachment(): void {
    if (!this.selectedFile || !this.reconciliation) return;

    this.isUploading = true;
    this.attachmentService.upload(
      this.selectedFile,
      'reconciliation',
      this.reconciliation.id,
      this.uploadDescription || undefined
    ).pipe(
      finalize(() => this.isUploading = false)
    ).subscribe({
      next: () => {
        this.snackBar.open('附件上传成功', '关闭', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.selectedFile = null;
        this.uploadDescription = '';
        this.loadLinkedRecords(this.reconciliation.id);
      },
      error: (error) => {
        this.snackBar.open('上传失败: ' + (error.message || '未知错误'), '关闭', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  downloadAttachment(attachment: Attachment): void {
    this.attachmentService.download(attachment.id).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) return;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.originalName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.snackBar.open('下载失败: ' + (error.message || '未知错误'), '关闭', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  private generateUnmatchedBills(): any[] {
    return [
      { billNumber: 'BL-2024-001', customer: '公司A', amount: 5000, dueDate: '2024-01-15', reason: '银行未到账' },
      { billNumber: 'BL-2024-002', customer: '公司B', amount: 3200, dueDate: '2024-01-20', reason: '金额不匹配' },
    ];
  }

  private generateUnmatchedBankRecords(): any[] {
    return [
      { reference: 'BNK-001', amount: 4500, date: '2024-01-18', payer: '公司C', reason: '无对应账单' },
      { reference: 'BNK-002', amount: 8000, date: '2024-01-22', payer: '公司D', reason: '待确认' },
    ];
  }

  private generateVarianceGroups(breakdown: any[]): any[] {
    const groups = [
      { name: '金额差异', icon: 'monetization_on', amount: 2300, items: [] },
      { name: '时间差异', icon: 'schedule', amount: -1500, items: [] },
      { name: '手续费差异', icon: 'payments', amount: 200, items: [] },
      { name: '汇率差异', icon: 'currency_exchange', amount: 800, items: [] },
    ];

    return groups.map(group => ({
      ...group,
      items: this.generateVarianceItems(group.name),
      dataSource: new MatTableDataSource(this.generateVarianceItems(group.name))
    }));
  }

  private generateVarianceItems(type: string): any[] {
    return [
      { type, description: `${type}明细1`, amount: 1000, date: '2024-01-10', status: 'pending' },
      { type, description: `${type}明细2`, amount: -500, date: '2024-01-12', status: 'reconciled' },
      { type, description: `${type}明细3`, amount: 800, date: '2024-01-15', status: 'pending' },
    ];
  }

  private generateNotes(): any[] {
    return [
      { title: '系统备注', content: '对账周期初始化完成，等待开始对账。', createdAt: '2024-01-01T00:00:00Z' },
      { title: '操作员备注', content: '已核对大部分账单，剩余几笔需要与财务确认。', createdAt: '2024-01-10T10:30:00Z' },
    ];
  }
}
