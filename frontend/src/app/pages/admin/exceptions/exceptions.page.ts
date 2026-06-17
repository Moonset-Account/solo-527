import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../../services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'exceptions-page',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <div class="page-title">🔍 异常关闭复盘</div>
          <div class="page-subtitle">异常关闭必填原因 · 原单完整链路追溯 · 按原因分类统计复盘</div>
        </div>
        <div class="flex gap-8">
          <button mat-stroked-button (click)="load()"><span class="material-icons">refresh</span> 刷新</button>
          <mat-form-field appearance="outline" style="width:200px;height:40px">
            <mat-label>按原因筛选</mat-label>
            <mat-select [(value)]="filterReason" (selectionChange)="load()">
              <mat-option value="">全部原因</mat-option>
              <mat-option *ngFor="let r of reasons" [value]="r.id">{{ r.name }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </div>

      <div class="grid grid-4 gap-16 mb-24">
        <kpi-card label="异常关闭总数" [value]="total" theme="rose"></kpi-card>
        <kpi-card label="身份信息不符" [value]="byCategory.id_mismatch || 0" theme="amber" sub="需人工验证"></kpi-card>
        <kpi-card label="重复报名/占位" [value]="byCategory.duplicate || 0" theme="indigo"></kpi-card>
        <kpi-card label="用户主动取消" [value]="byCategory.user_cancel || 0" theme="slate"></kpi-card>
      </div>

      <div class="grid grid-2 gap-24 mb-24">
        <div class="card">
          <div class="card-header">
            <div class="card-title"><span class="material-icons icon">pie_chart</span> 原因分布</div>
          </div>
          <div echarts [options]="pieOption" style="height:320px"></div>
        </div>
        <div class="card">
          <div class="card-header">
            <div class="card-title"><span class="material-icons icon">bar_chart</span> 分类统计（含平均质量分）</div>
          </div>
          <div echarts [options]="barOption" style="height:320px"></div>
        </div>
      </div>

      <div class="card mb-24">
        <div class="card-header">
          <div class="card-title"><span class="material-icons icon">insights</span> 关键发现</div>
        </div>
        <div class="grid grid-3 gap-16" style="padding:0 24px 24px">
          <div class="insight-card insight-amber">
            <div class="insight-title">⚠ 高发原因 TOP1</div>
            <div class="insight-value">{{ topReason || '—' }}</div>
            <div class="insight-desc">占比 {{ topReasonPct }}%，建议优化前端校验减少此类</div>
          </div>
          <div class="insight-card insight-rose">
            <div class="insight-title">💔 高质量流失</div>
            <div class="insight-value">{{ highQualityLost }} 单</div>
            <div class="insight-desc">原单质量≥85分的异常关闭，值得重点复盘</div>
          </div>
          <div class="insight-card insight-indigo">
            <div class="insight-title">⏱ 平均关闭耗时</div>
            <div class="insight-value">{{ avgCloseHours }} 小时</div>
            <div class="insight-desc">从提交到审核关闭，建议控制在4小时内</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title"><span class="material-icons icon">history</span> 异常关闭记录（点击「追溯」查看完整原单链路）</div>
          <div style="color:#64748b;font-size:13px">共 {{ data.data.length }} 条记录</div>
        </div>

        <table mat-table [dataSource]="data" style="width:100%">
          <ng-container matColumnDef="exceptionNo">
            <th mat-header-cell *matHeaderCellDef>异常编号</th>
            <td mat-cell *matCellDef="let e" style="font-family:monospace;color:#be123c;font-weight:600">{{ e.exceptionNo }}</td>
          </ng-container>
          <ng-container matColumnDef="reason">
            <th mat-header-cell *matHeaderCellDef>关闭原因</th>
            <td mat-cell *matCellDef="let e">
              <span class="chip"
                [ngClass]="{
                  'chip-rose': e.closeReason.category==='id_mismatch',
                  'chip-amber': e.closeReason.category==='duplicate',
                  'chip-indigo': e.closeReason.category==='user_cancel',
                  'chip-slate': e.closeReason.category==='fraud',
                  'chip-emerald': e.closeReason.category==='other'
                }">{{ e.closeReason.name }}</span>
              <div *ngIf="e.customReason" style="font-size:11px;color:#64748b;margin-top:4px">自定义：{{ e.customReason }}</div>
            </td>
          </ng-container>
          <ng-container matColumnDef="user">
            <th mat-header-cell *matHeaderCellDef>原单参会人</th>
            <td mat-cell *matCellDef="let e">
              <div style="font-weight:600">{{ e.registration.user.name }}</div>
              <div style="font-size:11px;color:#64748b">{{ e.registration.user.company }} · {{ e.registration.user.title }}</div>
            </td>
          </ng-container>
          <ng-container matColumnDef="order">
            <th mat-header-cell *matHeaderCellDef>关联原单</th>
            <td mat-cell *matCellDef="let e">
              <div style="font-family:monospace;color:#3b82f6;font-size:12px">{{ e.registration.orderNo }}</div>
              <div style="font-size:11px;color:#64748b">{{ e.registration.ticketType?.name || '-' }} · {{ e.registration.session?.name || '-' }}</div>
            </td>
          </ng-container>
          <ng-container matColumnDef="quality">
            <th mat-header-cell *matHeaderCellDef>原单质量</th>
            <td mat-cell *matCellDef="let e">
              <strong [style.color]="qsColor(e.registration.qualityScore)">{{ e.registration.qualityScore }}</strong> 分
            </td>
          </ng-container>
          <ng-container matColumnDef="note">
            <th mat-header-cell *matHeaderCellDef>审核备注</th>
            <td mat-cell *matCellDef="let e">
              <div style="max-width:200px;font-size:12px;color:#475569">{{ e.note || '—' }}</div>
            </td>
          </ng-container>
          <ng-container matColumnDef="operator">
            <th mat-header-cell *matHeaderCellDef>操作人</th>
            <td mat-cell *matCellDef="let e">
              <div style="font-weight:500">{{ e.operator?.name || '系统' }}</div>
              <div style="font-size:11px;color:#64748b">{{ formatTime(e.createdAt) }}</div>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef style="width:140px">操作</th>
            <td mat-cell *matCellDef="let e">
              <button mat-stroked-button color="primary" (click)="openTrace(e)">
                <span class="material-icons">account_tree</span> 追溯原单
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let e; columns: cols" class="row-hover"></tr>
        </table>
        <mat-paginator #paginator [pageSize]="10" [pageSizeOptions]="[5,10,20,50]" showFirstLastButtons></mat-paginator>
      </div>
    </div>

    <div *ngIf="traceData" class="trace-backdrop" (click)="closeTrace()">
      <div class="trace-drawer" (click)="$event.stopPropagation()">
        <div class="trace-header">
          <div>
            <div style="font-size:18px;font-weight:800">🔗 原单完整链路追溯</div>
            <div style="font-size:13px;color:#64748b;margin-top:4px">
              异常单 <span style="font-family:monospace;color:#be123c">{{ traceData.exception.exceptionNo }}</span>
              → 原单 <span style="font-family:monospace;color:#3b82f6">{{ traceData.registration.orderNo }}</span>
            </div>
          </div>
          <button mat-icon-button (click)="closeTrace()"><span class="material-icons">close</span></button>
        </div>

        <div class="trace-body">
          <div class="grid grid-2 gap-24 mb-20">
            <div class="trace-panel">
              <div class="panel-title"><span class="material-icons">person</span> 参会人信息</div>
              <div class="info-row"><span>姓名</span><strong>{{ traceData.registration.user.name }}</strong></div>
              <div class="info-row"><span>手机</span><strong>{{ traceData.registration.user.phone }}</strong></div>
              <div class="info-row"><span>邮箱</span><strong>{{ traceData.registration.user.email }}</strong></div>
              <div class="info-row"><span>公司</span><strong>{{ traceData.registration.user.company }}</strong></div>
              <div class="info-row"><span>职位</span><strong>{{ traceData.registration.user.title }}</strong></div>
            </div>
            <div class="trace-panel">
              <div class="panel-title"><span class="material-icons">receipt_long</span> 原单信息</div>
              <div class="info-row"><span>订单号</span><strong style="font-family:monospace">{{ traceData.registration.orderNo }}</strong></div>
              <div class="info-row"><span>票种</span><strong>{{ traceData.registration.ticketType?.name || '-' }}</strong></div>
              <div class="info-row"><span>场次</span><strong>{{ traceData.registration.session?.name || '-' }}</strong></div>
              <div class="info-row"><span>金额</span><strong style="color:#059669">¥{{ traceData.registration.amount?.toFixed(2) || '0.00' }}</strong></div>
              <div class="info-row"><span>质量分</span>
                <strong [style.color]="qsColor(traceData.registration.qualityScore)">{{ traceData.registration.qualityScore }} 分</strong>
              </div>
            </div>
          </div>

          <div class="trace-panel mb-20">
            <div class="panel-title"><span class="material-icons">block</span> 异常关闭详情</div>
            <div class="grid grid-2 gap-16">
              <div class="info-row"><span>关闭原因</span>
                <span class="chip chip-rose">{{ traceData.exception.closeReason?.name || '-' }}</span>
              </div>
              <div class="info-row"><span>操作人</span><strong>{{ traceData.exception.operator?.name || '系统' }}</strong></div>
              <div class="info-row"><span>关闭时间</span><strong>{{ formatTime(traceData.exception.createdAt) }}</strong></div>
              <div class="info-row"><span>自定义原因</span><strong>{{ traceData.exception.customReason || '—' }}</strong></div>
            </div>
            <div class="info-row" style="margin-top:8px"><span>审核备注</span>
              <div style="flex:1;background:#fef2f2;border:1px solid #fecdd3;border-radius:8px;padding:10px 14px;font-size:13px;color:#881337">
                {{ traceData.exception.note || '无备注' }}
              </div>
            </div>
          </div>

          <div class="trace-panel">
            <div class="panel-title"><span class="material-icons">timeline</span> 状态变更时间轴</div>
            <div class="timeline">
              <div *ngFor="let step of traceData.timeline; let last=last" class="tl-item">
                <div class="tl-dot" [ngClass]="step.color"></div>
                <div class="tl-line" *ngIf="!last"></div>
                <div class="tl-content">
                  <div class="tl-title">{{ step.title }}</div>
                  <div class="tl-meta">{{ formatTime(step.time) }} · {{ step.operator }}</div>
                  <div *ngIf="step.detail" class="tl-detail">{{ step.detail }}</div>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="traceData.refund" class="trace-panel mt-20">
            <div class="panel-title"><span class="material-icons">undo</span> 关联退款记录</div>
            <div class="info-row"><span>退款单号</span><strong style="font-family:monospace;color:#be123c">{{ traceData.refund.refundNo }}</strong></div>
            <div class="info-row"><span>退款金额</span><strong style="color:#be123c">¥{{ traceData.refund.amount?.toFixed(2) }}</strong></div>
            <div class="info-row"><span>状态</span>
              <span class="chip" [ngClass]="{'chip-checked':traceData.refund.status==='executed','chip-pending':traceData.refund.status==='pending'}">
                {{ {pending:'待处理',approved:'待执行',executed:'已退款',rejected:'已驳回',failed:'失败'}[traceData.refund.status] }}
              </span>
            </div>
          </div>

          <div *ngIf="traceData.guestAllocation" class="trace-panel mt-20">
            <div class="panel-title"><span class="material-icons">star</span> 关联嘉宾分配</div>
            <div class="info-row"><span>嘉宾配额</span><strong>{{ traceData.guestAllocation.guest?.name || '-' }}</strong></div>
            <div class="info-row"><span>优先级</span><strong>P{{ traceData.guestAllocation.priority || '-' }}</strong></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .insight-card { border-radius:14px; padding:20px; border:1px solid }
    .insight-amber { background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%); border-color:#fcd34d }
    .insight-rose { background:linear-gradient(135deg,#fff1f2 0%,#ffe4e6 100%); border-color:#fda4af }
    .insight-indigo { background:linear-gradient(135deg,#eef2ff 0%,#e0e7ff 100%); border-color:#a5b4fc }
    .insight-title { font-size:12px;color:#64748b;font-weight:600;margin-bottom:6px }
    .insight-value { font-size:28px;font-weight:800;color:#0f172a;line-height:1.2;margin-bottom:6px }
    .insight-desc { font-size:12px;color:#64748b }
    .trace-backdrop { position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:1000;display:flex;justify-content:flex-end;backdrop-filter:blur(4px) }
    .trace-drawer { width:780px;max-width:92vw;background:#fff;height:100%;overflow-y:auto;box-shadow:-20px 0 60px rgba(0,0,0,.2);animation:slideIn .25s ease }
    @keyframes slideIn { from { transform:translateX(100%) } to { transform:translateX(0) } }
    .trace-header { display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #e2e8f0;position:sticky;top:0;background:#fff;z-index:10 }
    .trace-body { padding:24px }
    .trace-panel { background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px 20px }
    .trace-panel + .trace-panel { margin-top:16px }
    .panel-title { font-size:14px;font-weight:700;color:#0f172a;margin-bottom:14px;display:flex;align-items:center;gap:6px }
    .panel-title .material-icons { font-size:18px;color:#3b82f6 }
    .info-row { display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px dashed #e2e8f0;font-size:13px }
    .info-row:last-child { border-bottom:none }
    .info-row > span:first-child { color:#64748b }
    .timeline { position:relative;padding-left:28px }
    .tl-item { position:relative;padding-bottom:20px }
    .tl-item:last-child { padding-bottom:0 }
    .tl-dot { position:absolute;left:-28px;top:2px;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 1px #cbd5e1 }
    .tl-dot.c-emerald { background:#10b981 }
    .tl-dot.c-blue { background:#3b82f6 }
    .tl-dot.c-amber { background:#f59e0b }
    .tl-dot.c-rose { background:#ef4444 }
    .tl-dot.c-slate { background:#64748b }
    .tl-line { position:absolute;left:-22px;top:16px;width:2px;height:calc(100% - 14px);background:#e2e8f0 }
    .tl-title { font-weight:700;color:#0f172a;font-size:14px }
    .tl-meta { font-size:11px;color:#64748b;margin-top:2px }
    .tl-detail { font-size:12px;color:#475569;margin-top:4px;background:#fff;padding:8px 12px;border-radius:8px;border:1px solid #e2e8f0 }
    .chip-slate { background:#f1f5f9;color:#334155;border:1px solid #cbd5e1 }
    .chip-emerald { background:#d1fae5;color:#065f46;border:1px solid #6ee7b7 }
  `]
})
export class ExceptionsPage implements OnInit {
  cols = ['exceptionNo', 'reason', 'user', 'order', 'quality', 'note', 'operator', 'actions'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  data = new MatTableDataSource<any>([]);
  reasons: any[] = [];
  total = 0;
  byCategory: any = {};
  filterReason = '';
  traceData: any = null;
  pieOption: any = {};
  barOption: any = {};
  topReason = '';
  topReasonPct = 0;
  highQualityLost = 0;
  avgCloseHours = 0;

  constructor(private api: ApiService, public dialog: MatDialog) {}

  ngOnInit() {
    this.load();
  }

  async load() {
    const [reasonsRes, listRes] = await Promise.all([
      firstValueFrom(this.api.listCloseReasons()),
      firstValueFrom(this.api.listExceptions({ reasonId: this.filterReason })),
    ]);
    this.reasons = reasonsRes as any[];
    const list: any[] = (listRes as any).items || listRes || [];
    this.data.data = list;
    this.total = list.length;
    setTimeout(() => this.data.paginator = this.paginator, 50);

    this.byCategory = {};
    let qualitySum = 0, qualityCnt = 0;
    let closeHours = 0, closeCnt = 0;
    list.forEach(e => {
      const cat = e.closeReason?.category || 'other';
      this.byCategory[cat] = (this.byCategory[cat] || 0) + 1;
      if (e.registration?.qualityScore >= 85) this.highQualityLost++;
      if (e.registration?.qualityScore != null) { qualitySum += e.registration.qualityScore; qualityCnt++; }
      if (e.createdAt && e.registration?.submittedAt) {
        closeHours += (new Date(e.createdAt).getTime() - new Date(e.registration.submittedAt).getTime()) / 3600000;
        closeCnt++;
      }
    });
    this.avgCloseHours = closeCnt ? Math.round(closeHours / closeCnt * 10) / 10 : 0;

    const reasonCount: any = {};
    this.reasons.forEach(r => { reasonCount[r.name] = 0; });
    list.forEach(e => { const n = e.closeReason?.name || '其他'; reasonCount[n] = (reasonCount[n] || 0) + 1; });

    const pieData = Object.entries(reasonCount).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
    let maxV = 0;
    pieData.forEach(d => { if (d.value > maxV) { maxV = d.value; this.topReason = d.name; } });
    this.topReasonPct = this.total ? Math.round(maxV / this.total * 100) : 0;

    this.pieOption = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { fontSize: 12 } },
      series: [{
        type: 'pie', radius: ['45%', '72%'], center: ['38%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { formatter: '{b}\n{d}%', fontSize: 11 },
        data: pieData,
        color: ['#ef4444', '#f59e0b', '#6366f1', '#64748b', '#10b981', '#8b5cf6', '#ec4899']
      }]
    };

    const catNames: any = { id_mismatch: '身份不符', duplicate: '重复/占位', user_cancel: '用户取消', fraud: '疑似欺诈', other: '其他' };
    const categories = Object.keys(catNames);
    const catCounts = categories.map(c => this.byCategory[c] || 0);
    const catQualities = categories.map(c => {
      const items = list.filter(e => e.closeReason?.category === c);
      if (!items.length) return 0;
      return Math.round(items.reduce((s, e) => s + (e.registration?.qualityScore || 0), 0) / items.length);
    });

    this.barOption = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['关闭数量', '平均质量分'], top: 0 },
      grid: { left: 50, right: 60, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: categories.map(c => catNames[c]) },
      yAxis: [
        { type: 'value', name: '数量', axisLabel: { color: '#ef4444' } },
        { type: 'value', name: '质量分', min: 0, max: 100, axisLabel: { color: '#10b981' } }
      ],
      series: [
        { name: '关闭数量', type: 'bar', data: catCounts, itemStyle: { color: '#ef4444', borderRadius: [6, 6, 0, 0] }, barWidth: 30 },
        { name: '平均质量分', type: 'line', yAxisIndex: 1, data: catQualities, itemStyle: { color: '#10b981' }, lineStyle: { width: 3 }, symbol: 'circle', symbolSize: 10 }
      ]
    };
  }

  qsColor(s: number) {
    if (s >= 85) return '#059669';
    if (s >= 70) return '#2563eb';
    if (s >= 55) return '#d97706';
    return '#dc2626';
  }

  formatTime(t: any) {
    if (!t) return '';
    const d = new Date(t);
    return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  async openTrace(e: any) {
    const res = await firstValueFrom(this.api.traceException(e.id));
    this.traceData = res;
  }

  closeTrace() {
    this.traceData = null;
  }
}
