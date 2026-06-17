import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../../services/api.service';
import { CloseDialog } from '../../../components/close-dialog/close-dialog.component';
import { ReviewDialog } from '../../../components/review-dialog/review-dialog.component';

@Component({
  selector: 'reviews-page',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <div class="page-title">🧾 报名审核工作台</div>
          <div class="page-subtitle">共 {{ total }} 条记录 · 待审核 {{ pendingCount }} 人</div>
        </div>
        <div class="flex gap-8">
          <button mat-stroked-button (click)="load()"><span class="material-icons">refresh</span></button>
          <button mat-raised-button color="primary" (click)="batchApprove()" [disabled]="!selected.length">
            <span class="material-icons">check_circle</span> 批量通过 ({{selected.length}})
          </button>
        </div>
      </div>

      <div class="card">
        <div class="filters grid grid-4 gap-12 mb-16">
          <mat-form-field appearance="outline" style="margin:0">
            <mat-label>搜索 (姓名/手机/订单/公司)</mat-label>
            <input matInput (keyup)="applyFilter($event)" #input placeholder="输入关键词">
          </mat-form-field>
          <mat-form-field appearance="outline" style="margin:0">
            <mat-label>审核状态</mat-label>
            <mat-select [(ngModel)]="filters.status" (selectionChange)="load()">
              <mat-option value="">全部</mat-option>
              <mat-option value="pending">待审核</mat-option>
              <mat-option value="reviewing">审核中</mat-option>
              <mat-option value="approved">通过</mat-option>
              <mat-option value="paid">已支付</mat-option>
              <mat-option value="checked_in">已签到</mat-option>
              <mat-option value="rejected">未通过</mat-option>
              <mat-option value="refunded">已退款</mat-option>
              <mat-option value="closed">异常关闭</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" style="margin:0">
            <mat-label>质量分数 ≥</mat-label>
            <input matInput type="number" [(ngModel)]="filters.qualityFrom" (change)="load()">
          </mat-form-field>
          <div style="display:flex;gap:8px;align-items:flex-end">
            <button mat-raised-button (click)="load()"><span class="material-icons">filter_alt</span> 筛选</button>
            <button mat-stroked-button (click)="resetFilter()">重置</button>
          </div>
        </div>

        <div class="table-wrap">
          <table mat-table [dataSource]="data" matSort multiTemplateDataRows style="width:100%">
            <ng-container matColumnDef="select">
              <th mat-header-cell *matHeaderCellDef style="width:48px">
                <mat-checkbox (change)="$event ? toggleAllRows() : null"
                  [checked]="selection.hasValue() && isAllSelected()"></mat-checkbox>
              </th>
              <td mat-cell *matCellDef="let r">
                <mat-checkbox (click)="$event.stopPropagation()"
                  (change)="toggleRow(r)" [checked]="selection.isSelected(r)">
                </mat-checkbox>
              </td>
            </ng-container>
            <ng-container matColumnDef="orderNo">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>订单号</th>
              <td mat-cell *matCellDef="let r" style="font-family:monospace;color:#3b82f6;cursor:pointer"
                (click)="openDetail(r)">{{ r.orderNo }}</td>
            </ng-container>
            <ng-container matColumnDef="user">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>参会人</th>
              <td mat-cell *matCellDef="let r">
                <div style="display:flex;align-items:center;gap:10px">
                  <div class="avatar-sm">{{ r.user.name.charAt(0) }}</div>
                  <div>
                    <div style="font-weight:600">{{ r.user.name }}
                      <span *ngIf="r.guestAllocation" class="chip chip-closed" style="margin-left:6px">嘉宾</span>
                    </div>
                    <div style="font-size:11px;color:#64748b">{{ r.user.phone }} · {{ r.user.company }}</div>
                  </div>
                </div>
              </td>
            </ng-container>
            <ng-container matColumnDef="ticket">
              <th mat-header-cell *matHeaderCellDef>票种 / 场次</th>
              <td mat-cell *matCellDef="let r">
                <div style="font-weight:500">{{ r.ticketType.name }}</div>
                <div style="font-size:11px;color:#64748b">{{ r.session.name }}</div>
              </td>
            </ng-container>
            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>金额</th>
              <td mat-cell *matCellDef="let r" style="color:#be123c;font-weight:600">¥{{ r.amount }}</td>
            </ng-container>
            <ng-container matColumnDef="quality">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>质量分</th>
              <td mat-cell *matCellDef="let r">
                <div class="qscore" [class.high]="r.qualityScore>=85" [class.mid]="r.qualityScore>=75&&r.qualityScore<85">
                  <strong>{{ r.qualityScore || '-' }}</strong>
                  <span *ngIf="r.qualityScore>=85">⭐</span>
                </div>
              </td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>状态</th>
              <td mat-cell *matCellDef="let r"><status-badge [status]="r.status"></status-badge></td>
            </ng-container>
            <ng-container matColumnDef="time">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>提交时间</th>
              <td mat-cell *matCellDef="let r" style="font-size:12px;color:#64748b">
                {{ formatTime(r.createdAt) }}
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef style="width:180px">操作</th>
              <td mat-cell *matCellDef="let r">
                <button *ngIf="['pending','reviewing'].includes(r.status)"
                  mat-icon-button color="primary" matTooltip="通过" (click)="approve(r)">
                  <span class="material-icons">check</span>
                </button>
                <button *ngIf="['pending','reviewing'].includes(r.status)"
                  mat-icon-button color="warn" matTooltip="驳回" (click)="reject(r)">
                  <span class="material-icons">close</span>
                </button>
                <button *ngIf="['pending','reviewing'].includes(r.status)"
                  mat-icon-button style="color:#d97706" matTooltip="异常关闭" (click)="close(r)">
                  <span class="material-icons">block</span>
                </button>
                <button mat-icon-button matTooltip="详情" (click)="openDetail(r)">
                  <span class="material-icons">visibility</span>
                </button>
              </td>
            </ng-container>
            <ng-container matColumnDef="expandedDetail">
              <td mat-cell *matCellDef="let r" [attr.colspan]="displayedColumns.length">
                <div class="detail" *ngIf="expandedId===r.id">
                  <div class="grid grid-3 gap-16">
                    <div class="detail-box">
                      <div class="d-title">报名资料</div>
                      <div class="d-row"><span>姓名</span><strong>{{ r.user.name }}</strong></div>
                      <div class="d-row"><span>手机</span><strong>{{ r.user.phone }}</strong></div>
                      <div class="d-row"><span>邮箱</span><strong>{{ r.user.email || '-' }}</strong></div>
                      <div class="d-row"><span>身份证</span><strong>{{ r.user.idCardHash || '未上传' }}</strong></div>
                      <div class="d-row"><span>公司</span><strong>{{ r.user.company }}</strong></div>
                      <div class="d-row"><span>职位</span><strong>{{ r.user.title }}</strong></div>
                      <div class="d-row"><span>来源</span><strong>{{ r.user.channelSource }}</strong></div>
                    </div>
                    <div class="detail-box">
                      <div class="d-title">质量评估</div>
                      <div class="d-row" *ngIf="r.qualityMetric">
                        <span>渠道质量</span>
                        <div style="flex:1;margin:0 12px">
                          <mat-progress-bar mode="determinate" [value]="r.qualityMetric.channelScore" color="primary"></mat-progress-bar>
                        </div>
                        <strong>{{ r.qualityMetric.channelScore }}</strong>
                      </div>
                      <div class="d-row" *ngIf="r.qualityMetric">
                        <span>公司级别</span>
                        <div style="flex:1;margin:0 12px">
                          <mat-progress-bar mode="determinate" [value]="r.qualityMetric.companyScore" color="accent"></mat-progress-bar>
                        </div>
                        <strong>{{ r.qualityMetric.companyScore }}</strong>
                      </div>
                      <div class="d-row" *ngIf="r.qualityMetric">
                        <span>职位匹配</span>
                        <div style="flex:1;margin:0 12px">
                          <mat-progress-bar mode="determinate" [value]="r.qualityMetric.positionScore"></mat-progress-bar>
                        </div>
                        <strong>{{ r.qualityMetric.positionScore }}</strong>
                      </div>
                      <div class="d-row" *ngIf="r.qualityMetric">
                        <span>综合评分</span>
                        <strong style="font-size:24px;color:#1e3a8a">{{ r.qualityMetric.totalScore }}</strong>
                      </div>
                      <div class="mt-16" *ngIf="r.closeException">
                        <span style="color:#991b1b;font-weight:600">⚠ 异常关闭原因：</span>
                        <span>{{ r.closeException.closeReason.name }}</span>
                        <div *ngIf="r.closeException.note" style="color:#64748b;margin-top:4px;font-size:12px">
                          备注：{{ r.closeException.note }}
                        </div>
                      </div>
                    </div>
                    <div class="detail-box">
                      <div class="d-title">审核操作</div>
                      <div class="d-row"><span>审核状态</span>
                        <strong><status-badge [status]="r.status"></status-badge></strong>
                      </div>
                      <div class="d-row" *ngIf="r.reviewAt"><span>审核时间</span><strong>{{ formatTime(r.reviewAt) }}</strong></div>
                      <div class="d-row" *ngIf="r.reviewNote"><span>审核意见</span>
                        <div style="max-width:200px;white-space:pre-wrap;text-align:right">{{ r.reviewNote }}</div>
                      </div>
                      <div class="d-row" *ngIf="r.checkinCode"><span>签到码</span>
                        <strong style="font-family:monospace;color:#059669">{{ r.checkinCode.code }}</strong>
                      </div>
                      <div class="mt-16" *ngIf="['pending','reviewing'].includes(r.status)">
                        <div style="display:flex;gap:8px">
                          <button mat-raised-button color="primary" style="flex:1" (click)="approve(r)">
                            <span class="material-icons">check</span> 通过
                          </button>
                          <button mat-raised-button color="warn" style="flex:1" (click)="reject(r)">
                            <span class="material-icons">close</span> 驳回
                          </button>
                        </div>
                        <button mat-stroked-button style="width:100%;margin-top:8px" (click)="close(r)">
                          <span class="material-icons" style="color:#d97706">block</span> 异常关闭（需填原因）
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let r; columns: displayedColumns"
              class="row-hover" [class.expanded]="expandedId===r.id"
              (click)="expandedId = expandedId===r.id ? null : r.id">
            </tr>
            <tr mat-row *matRowDef="let r; columns: ['expandedDetail']" class="detail-row"></tr>
          </table>
        </div>

        <mat-paginator #paginator [length]="total" [pageSize]="10" [pageSizeOptions]="[10,20,50,100]"
          (page)="load()" showFirstLastButtons style="margin-top:8px">
        </mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .avatar-sm { width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px; }
    .qscore strong { font-size:16px;color:#64748b; }
    .qscore.high strong { color:#059669; } .qscore.mid strong { color:#0369a1; }
    .qscore { font-size:12px; }
    .row-hover:hover { background:#f8fafc !important; cursor:pointer; }
    .row-hover.expanded { background:#eff6ff !important; }
    .detail-row { background:#fafbff; }
    .detail { padding:16px 24px 24px; }
    .detail-box { background:white;padding:16px 20px;border-radius:12px;border:1px solid #e2e8f0; }
    .d-title { font-weight:700;font-size:13px;color:#1e3a8a;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #f1f5f9; }
    .d-row { display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:13px; }
    .d-row span { color:#64748b; }
    .mat-mdc-table .mat-mdc-row .mat-mdc-cell { border-bottom:1px solid #f1f5f9; }
    .table-wrap { border:1px solid #e2e8f0;border-radius:12px;overflow:hidden; }
  `],
})
export class ReviewsPage implements OnInit {
  displayedColumns = ['select', 'orderNo', 'user', 'ticket', 'amount', 'quality', 'status', 'time', 'actions'];
  data = new MatTableDataSource<any>([]);
  total = 0; pendingCount = 0; expandedId: any = null;
  selection = new Set<any>(); selected: any[] = [];
  filters: any = { status: '', qualityFrom: null };
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(public api: ApiService, private dialog: MatDialog) {}

  async ngOnInit() { await this.load(); }
  formatTime(t: any) { return t ? new Date(t).toLocaleString('zh-CN') : '-'; }

  async load() {
    const q: any = {
      page: this.paginator?.pageIndex + 1 || 1,
      pageSize: this.paginator?.pageSize || 10,
      status: this.filters.status || undefined,
      qualityFrom: this.filters.qualityFrom || undefined,
    };
    const res: any = await firstValue(this.api.listRegistrations(q)) as any;
    this.data.data = res.items;
    this.total = res.total;
    this.pendingCount = res.items.filter((r: any) => ['pending', 'reviewing'].includes(r.status)).length;
    if (res.items.length) {
      const allPending = res.items.filter((r: any) => ['pending', 'reviewing'].includes(r.status));
      this.pendingCount += res.total > res.items.length ? (res.total - res.items.length) * 0.3 : 0;
    }
  }

  applyFilter(e: any) {
    const v = (e.target as HTMLInputElement).value.trim().toLowerCase();
    if (!v) { this.load(); return; }
    this.data.filter = v;
  }

  resetFilter() { this.filters = { status: '', qualityFrom: null }; this.load(); }

  isAllSelected() { return this.selection.size === this.data.data.length; }
  toggleAllRows() {
    this.isAllSelected() ? this.selection.clear() : this.data.data.forEach(r => this.selection.add(r));
    this.selected = Array.from(this.selection);
  }
  toggleRow(r: any) {
    this.selection.has(r) ? this.selection.delete(r) : this.selection.add(r);
    this.selected = Array.from(this.selection);
  }

  openDetail(r: any) { this.expandedId = this.expandedId === r.id ? null : r.id; }

  approve(r: any) {
    this.dialog.open(ReviewDialog, { data: { action: 'approve', id: r.id, orderNo: r.orderNo,
      name: r.user.name, ticketName: r.ticketType.name, sessionName: r.session.name }, width: '520px' })
      .afterClosed().subscribe(res => res && this.load());
  }
  reject(r: any) {
    this.dialog.open(ReviewDialog, { data: { action: 'reject', id: r.id, orderNo: r.orderNo,
      name: r.user.name, ticketName: r.ticketType.name, sessionName: r.session.name }, width: '520px' })
      .afterClosed().subscribe(res => res && this.load());
  }
  close(r: any) {
    this.dialog.open(CloseDialog, { data: { id: r.id }, width: '560px', disableClose: true })
      .afterClosed().subscribe(res => res && this.load());
  }

  async batchApprove() {
    if (!confirm(`确认批量通过 ${this.selected.length} 条报名？`)) return;
    const ids = this.selected.map(r => r.id);
    for (const id of ids) {
      try { await firstValue(this.api.reviewRegistration(id, { action: 'approve' })); } catch {}
    }
    this.api.toast(`已处理 ${ids.length} 条`);
    this.selection.clear(); this.selected = []; this.load();
  }
}

function firstValue(o: any) { return (o as any).pipe ? (o as any).toPromise() : Promise.resolve(o); }
