import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'gap-page',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <div class="page-title">⚠ 到场缺口待办</div>
          <div class="page-subtitle">系统自动识别缺口 → 推荐补位 → 处理结果联动质量统计</div>
        </div>
        <div class="flex gap-8">
          <button mat-stroked-button (click)="load()"><span class="material-icons">refresh</span> 刷新</button>
          <mat-button-toggle-group [(value)]="filter" (change)="load()">
            <mat-button-toggle value="pending">待处理 {{ stats?.pending || 0 }}</mat-button-toggle>
            <mat-button-toggle value="handled">已处理 {{ stats?.handled || 0 }}</mat-button-toggle>
            <mat-button-toggle value="all">全部</mat-button-toggle>
          </mat-button-toggle-group>
        </div>
      </div>

      <div class="grid grid-4 gap-16 mb-24">
        <kpi-card label="缺口待办" [value]="stats?.pending || 0" theme="rose" sub="需跟进处理"></kpi-card>
        <kpi-card label="高优先级(≥85)" [value]="stats?.highPriority || 0" theme="amber" sub="核心人群需优先补位"></kpi-card>
        <kpi-card label="今日已处理" [value]="stats?.todayHandled || 0" theme="emerald" [sub]="'累计 ' + (stats?.handled || 0) + ' 条'"></kpi-card>
        <kpi-card label="补位成功率" [value]="(stats?.replacePct || 0) + '%'" theme="indigo" [sub]="'补位 ' + (stats?.replacedCount || 0) + ' / 确认 ' + (stats?.confirmedCount || 0)"></kpi-card>
      </div>

      <div class="grid grid-2 gap-24 mb-24">
        <div class="card">
          <div class="card-header">
            <div class="card-title"><span class="material-icons icon">stacked_bar_chart</span> 处理结果与质量联动</div>
            <div style="font-size:12px;color:#64748b">补位+2分 · 确认+1分 · 关闭-1分 · 累计 <strong [style.color]="(stats?.totalQualityDelta||0)>=0?'#059669':'#ef4444'">{{ (stats?.totalQualityDelta||0)>=0?'+':'' }}{{ stats?.totalQualityDelta || 0 }} 分</strong></div>
          </div>
          <div echarts [options]="linkOption" style="height:280px"></div>
        </div>
        <div class="card">
          <div class="card-header">
            <div class="card-title"><span class="material-icons icon">donut_large</span> 处理方式分布</div>
          </div>
          <div echarts [options]="pieOption" style="height:280px"></div>
        </div>
      </div>

      <div class="grid grid-2 gap-24">
        <div>
          <h3 style="font-size:18px;font-weight:700;margin:0 0 12px;display:flex;align-items:center;gap:8px">
            <span class="material-icons" style="color:#ef4444">list_alert</span> 缺口待办清单
          </h3>
          <div *ngFor="let t of todos" class="gap-card"
            [class.high]="t.priority===1" [class.mid]="t.priority===2">
            <div class="gap-head">
              <div class="prio" [class.p1]="t.priority===1" [class.p2]="t.priority===2" [class.p3]="t.priority===3">
                P{{ t.priority }}
              </div>
              <div style="flex:1">
                <div style="font-weight:700">{{ t.registration.user.name }}
                  <span class="chip" style="margin-left:6px"
                    [ngClass]="t.gapType==='high_value_missing'?'chip-rose':'chip-amber'">
                    {{ t.gapType==='high_value_missing' ? '高价值缺失' : '未确认' }}
                  </span>
                </div>
                <div style="font-size:12px;color:#64748b;margin-top:2px">
                  {{ t.registration.user.company }} · {{ t.registration.user.title }}
                </div>
              </div>
              <div class="qscore">
                <div style="font-size:24px;font-weight:800" [style.color]="scoreColor(t.registration.qualityScore)">
                  {{ t.registration.qualityScore }}
                </div>
                <div style="font-size:10px;color:#64748b;text-align:right">质量分</div>
              </div>
            </div>
            <div class="gap-info">
              <div><span class="material-icons">confirmation_number</span>
                {{ t.registration.ticketType.name }} · {{ t.registration.session.name }}
              </div>
              <div><span class="material-icons">phone_iphone</span> {{ t.registration.user.phone }}</div>
            </div>
            <div *ngIf="t.status==='pending'" class="gap-actions">
              <button mat-stroked-button (click)="viewSug(t)" [disabled]="expandId===t.id">
                <span class="material-icons">lightbulb</span> AI 补位建议
              </button>
              <button mat-stroked-button (click)="handle(t, 'contacted')">
                <span class="material-icons">call</span> 已联系
              </button>
              <button mat-raised-button color="primary" (click)="handle(t, 'confirmed')">
                <span class="material-icons">check</span> 确认到场
              </button>
              <button mat-stroked-button color="warn" (click)="handle(t, 'closed_gap')">
                <span class="material-icons">close</span> 关闭名额
              </button>
            </div>

            <div *ngIf="expandId===t.id && suggestions[t.id]?.length" class="sug-box">
              <div style="font-weight:600;font-size:13px;margin-bottom:8px;color:#1e40af">
                <span class="material-icons" style="vertical-align:-3px">auto_awesome</span> 推荐补位候选人（按质量评分排序）
              </div>
              <div *ngFor="let s of suggestions[t.id]" class="cand-item">
                <div class="c-avatar">{{ s.name.charAt(0) }}</div>
                <div style="flex:1">
                  <div style="font-weight:600">{{ s.name }}
                    <span class="chip chip-approved" style="margin-left:6px;font-size:10px">质量 {{ s.qualityScore }} 分</span>
                  </div>
                  <div style="font-size:12px;color:#64748b">{{ s.company }} · {{ s.title }} · {{ s.phone }}</div>
                </div>
                <button mat-raised-button color="primary" style="height:36px;font-size:12px"
                  (click)="handle(t, 'replaced', '补位: '+s.name)">
                  替换为TA →
                </button>
              </div>
            </div>

            <div *ngIf="t.status==='handled'" class="handle-res">
              <span class="material-icons">check_circle</span>
              <div>
                <div><strong>处理结果：</strong>{{ handleResult(t.handleAction) }}
                  <span class="chip" style="margin-left:8px"
                    [ngClass]="qualityImpact(t.handleAction)>=0?'chip-approved':'chip-closed'">
                    质量分 {{ qualityImpact(t.handleAction)>=0?'+':'' }}{{ qualityImpact(t.handleAction) }}
                  </span>
                </div>
                <div style="font-size:11px;color:#64748b;margin-top:2px">
                  {{ t.handleNote || '—' }} · {{ formatTime(t.handledAt) }}
                </div>
              </div>
            </div>
          </div>
          <div *ngIf="!todos.length" class="empty">
            <span class="material-icons">celebration</span>
            <div style="font-weight:600;margin-top:8px">暂无待办</div>
          </div>
        </div>

        <div>
          <h3 style="font-size:18px;font-weight:700;margin:0 0 12px;display:flex;align-items:center;gap:8px">
            <span class="material-icons" style="color:#10b981">insights</span> 质量分 Top 10 未到场
          </h3>
          <div class="card" style="padding:0;overflow:hidden">
            <table mat-table [dataSource]="topMissing" style="width:100%">
              <ng-container matColumnDef="rank">
                <th mat-header-cell *matHeaderCellDef style="width:50px">#</th>
                <td mat-cell *matCellDef="let r;let i=index">
                  <span style="font-weight:800" [style.color]="i<3?'#f59e0b':'#64748b'">{{ i+1 }}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>参会者</th>
                <td mat-cell *matCellDef="let r">
                  <div style="font-weight:600">{{ r.registration.user.name }}</div>
                  <div style="font-size:11px;color:#64748b">{{ r.registration.user.company }}</div>
                </td>
              </ng-container>
              <ng-container matColumnDef="score">
                <th mat-header-cell *matHeaderCellDef>质量分</th>
                <td mat-cell *matCellDef="let r">
                  <strong [style.color]="scoreColor(r.registration.qualityScore)">
                    {{ r.registration.qualityScore }}
                  </strong>
                </td>
              </ng-container>
              <ng-container matColumnDef="act">
                <th mat-header-cell *matHeaderCellDef>操作</th>
                <td mat-cell *matCellDef="let r">
                  <button *ngIf="r.status==='pending'" mat-stroked-button color="primary" (click)="handle(r, 'confirmed')">
                    <span class="material-icons">check</span> 确认到场
                  </button>
                  <span *ngIf="r.status==='handled'" class="chip chip-approved">{{ handleResult(r.handleAction) }}</span>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="topCols"></tr>
              <tr mat-row *matRowDef="let r; columns: topCols" class="row-hover"></tr>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .gap-card { background:white;border-radius:14px;padding:18px 20px;margin-bottom:12px;border:2px solid #e2e8f0;transition:.2s; }
    .gap-card.high { border-color:#ef444480;background:linear-gradient(180deg,#fff1f2,#ffffff); }
    .gap-card.mid { border-color:#f59e0b80;background:linear-gradient(180deg,#fffbeb,#ffffff); }
    .gap-card:hover { box-shadow:0 8px 20px rgba(0,0,0,.06);transform:translateY(-2px); }
    .gap-head { display:flex;gap:12px;align-items:flex-start;margin-bottom:12px; }
    .prio { width:40px;height:40px;border-radius:10px;background:#64748b;color:white;display:flex;align-items:center;justify-content:center;font-weight:800; }
    .prio.p1 { background:linear-gradient(135deg,#be123c,#f43f5e);box-shadow:0 4px 12px #ef444440; }
    .prio.p2 { background:linear-gradient(135deg,#b45309,#f59e0b); }
    .prio.p3 { background:linear-gradient(135deg,#475569,#64748b); }
    .gap-info { display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:12px;color:#475569;padding:10px 14px;background:#f8fafc;border-radius:8px;margin-bottom:12px; }
    .gap-info .material-icons { font-size:14px;vertical-align:-2px;margin-right:4px;color:#3b82f6; }
    .gap-actions { display:flex;gap:6px;flex-wrap:wrap; }
    .gap-actions button { flex:1 0 auto;font-size:12px; }
    .sug-box { margin-top:12px;padding:12px 14px;background:#eff6ff;border-radius:10px;border:1px solid #bfdbfe; }
    .cand-item { display:flex;gap:10px;align-items:center;padding:10px;background:white;border-radius:8px;margin-bottom:6px; }
    .c-avatar { width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#10b981,#059669);color:white;display:flex;align-items:center;justify-content:center;font-weight:700; }
    .handle-res { margin-top:10px;padding:10px 12px;background:#f0fdf4;border-radius:8px;display:flex;gap:10px;align-items:center;color:#166534;font-size:12px; }
    .row-hover:hover { background:#f8fafc; }
    .empty { text-align:center;padding:40px 20px;color:#94a3b8;background:white;border-radius:14px; }
    .empty .material-icons { font-size:48px;color:#10b981; }
    .chip-rose { background:#fecdd3;color:#9f1239; }
    .chip-amber { background:#fde68a;color:#92400e; }
  `],
})
export class GapPage implements OnInit {
  todos: any[] = []; stats: any = {}; filter = 'pending';
  expandId: any = null; suggestions: Record<string, any[]> = {};
  topMissing: any[] = [];
  linkOption: any = {}; pieOption: any = {};
  topCols = ['rank', 'name', 'score', 'act'];
  constructor(public api: ApiService) {}
  formatTime(t: any) { return t ? new Date(t).toLocaleString('zh-CN') : ''; }
  scoreColor(s: number) { return s >= 85 ? '#059669' : s >= 75 ? '#0369a1' : s >= 60 ? '#d97706' : '#64748b'; }
  handleResult(a: string) {
    return { confirmed: '已确认到场', replaced: '已成功补位', closed_gap: '已关闭名额', contacted: '已与参会者联系' }[a as any] || a;
  }
  qualityImpact(a: string) {
    return { replaced: 2, confirmed: 1, closed_gap: -1, contacted: 0 }[a as any] || 0;
  }
  async ngOnInit() { await this.load(); }
  async load() {
    const res: any = await firstValue(this.api.listGapTodos(this.filter));
    this.todos = res.todos || [];
    this.stats = res.stats || {};
    this.topMissing = [...this.todos]
      .filter(t => t.priority <= 2)
      .sort((a, b) => (b.registration.qualityScore || 0) - (a.registration.qualityScore || 0))
      .slice(0, 10);
    this.buildCharts();
  }
  buildCharts() {
    const chart = this.stats?.dailyChart || [];
    const days = chart.length ? chart.map((d: any) => d.day.slice(5)) : ['暂无数据'];
    const confirmedData = chart.map((d: any) => d.confirmed);
    const replacedData = chart.map((d: any) => d.replaced);
    const closedData = chart.map((d: any) => d.closed);
    const qualityData = chart.map((d: any) => d.qualityDelta);
    this.linkOption = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['确认到场', '成功补位', '关闭名额', '质量分变化'] },
      grid: { left: 50, right: 50, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: days },
      yAxis: [
        { type: 'value', name: '处理数' },
        { type: 'value', name: '质量分Δ', axisLabel: { color: '#f59e0b' } },
      ],
      series: [
        { name: '确认到场', type: 'bar', stack: 'a', data: confirmedData, itemStyle: { color: '#10b981' } },
        { name: '成功补位', type: 'bar', stack: 'a', data: replacedData, itemStyle: { color: '#3b82f6' } },
        { name: '关闭名额', type: 'bar', stack: 'a', data: closedData, itemStyle: { color: '#ef4444' } },
        { name: '质量分变化', type: 'line', yAxisIndex: 1, smooth: true, data: qualityData,
          lineStyle: { color: '#f59e0b', width: 3 }, itemStyle: { color: '#f59e0b' },
          markPoint: { data: [{ type: 'max', name: '最大提升' }] } },
      ],
    };
    this.pieOption = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, textStyle: { fontSize: 12 } },
      series: [{
        type: 'pie', radius: ['40%', '68%'], center: ['50%', '45%'],
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { formatter: '{b}\n{d}%', fontSize: 11 },
        data: [
          { name: '确认到场', value: this.stats?.confirmedCount || 0, itemStyle: { color: '#10b981' } },
          { name: '成功补位', value: this.stats?.replacedCount || 0, itemStyle: { color: '#3b82f6' } },
          { name: '关闭名额', value: this.stats?.closedCount || 0, itemStyle: { color: '#ef4444' } },
          { name: '已联系', value: this.stats?.contactedCount || 0, itemStyle: { color: '#f59e0b' } },
        ].filter(d => d.value > 0),
      }],
    };
  }
  async viewSug(t: any) {
    this.expandId = this.expandId === t.id ? null : t.id;
    if (!this.suggestions[t.id]) {
      const res = await firstValue(this.api.getSuggestions(t.registrationId)) as any[];
      this.suggestions[t.id] = res && res.length ? res : [
        { id: 'm1', name: '模拟候选人A', company: '示例科技', title: 'CTO', phone: '138-0000-0001', qualityScore: 92 },
        { id: 'm2', name: '模拟候选人B', company: '智启AI', title: 'VP of Eng', phone: '138-0000-0002', qualityScore: 88 },
      ];
    }
  }
  async handle(t: any, action: string, note = '') {
    const impact = this.qualityImpact(action);
    const msg = action === 'closed_gap'
      ? '确认关闭此名额？质量分将 -1'
      : action === 'confirmed'
      ? '确认该参会者已到场？质量分将 +1'
      : action === 'replaced'
      ? '确认使用补位候选人？质量分将 +2'
      : '标记为已联系？';
    if (!confirm(msg)) return;
    try {
      await firstValue(this.api.handleGap(t.registrationId, { action, note }));
      const label = impact > 0 ? `处理完成，质量分 +${impact}` : impact < 0 ? `处理完成，质量分 ${impact}` : '处理完成';
      this.api.toast(label);
      await this.load();
    } catch (e: any) { this.api.toast(e.error?.message || '操作失败', 'error'); }
  }
}
function firstValue(o: any) { return (o as any).pipe ? (o as any).toPromise() : Promise.resolve(o); }
