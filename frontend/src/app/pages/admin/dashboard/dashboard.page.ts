import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'dashboard-page',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <div class="page-title">📊 总览仪表板</div>
          <div class="page-subtitle">实时掌握峰会报名全链路数据 · 最后更新 {{ updateTime }}</div>
        </div>
        <button mat-raised-button color="primary" (click)="load()"><span class="material-icons">refresh</span> 刷新数据</button>
      </div>

      <div class="grid grid-4 mb-24">
        <kpi-card [label]="'总报名数'" [value]="data?.kpi?.total || 0"
          theme="indigo" [sub]="'待审核 ' + (data?.todos?.pendingReview||0) + ' 人'"></kpi-card>
        <kpi-card [label]="'审核通过'" [value]="(data?.kpi?.approved||0)+(data?.kpi?.paid||0)+(data?.kpi?.checkedIn||0)"
          theme="emerald" [sub]="'通过率 ' + (data?.kpi?.passRate||0) + '%'"></kpi-card>
        <kpi-card [label]="'已签到'" [value]="data?.kpi?.checkedIn || 0"
          theme="violet" [sub]="'到场率 ' + (data?.kpi?.checkInRate||0) + '%'"></kpi-card>
        <kpi-card [label]="'累计营收'" [value]="'¥' + formatNum(data?.kpi?.revenue || 0)"
          theme="amber" [sub]="'退款率 ' + (data?.kpi?.refundRate||0) + '%'"></kpi-card>
      </div>

      <div class="grid grid-3 mb-24">
        <kpi-card [label]="'待审核'" [value]="data?.todos?.pendingReview || 0"
          theme="sky" sub="点此处理 →" style="cursor:pointer" routerLink="/admin/reviews"></kpi-card>
        <kpi-card [label]="'待退款'" [value]="data?.todos?.pendingRefunds || 0"
          theme="rose" sub="点此处理 →" style="cursor:pointer" routerLink="/admin/refunds"></kpi-card>
        <kpi-card [label]="'到场缺口待办'" [value]="data?.todos?.gapTodos || 0"
          theme="amber" sub="点此处理 →" style="cursor:pointer" routerLink="/admin/gap"></kpi-card>
      </div>

      <div class="grid grid-2 gap-24">
        <div class="card">
          <div class="card-header">
            <div class="card-title"><span class="material-icons icon">show_chart</span> 近 30 天报名趋势</div>
            <span class="chip chip-approved">实时</span>
          </div>
          <div echarts [options]="trendOption" style="height:320px"></div>
        </div>
        <div class="card">
          <div class="card-header">
            <div class="card-title"><span class="material-icons icon">donut_large</span> 票种销售分布</div>
          </div>
          <div echarts [options]="ticketOption" style="height:320px"></div>
        </div>
      </div>

      <div class="grid grid-3 gap-24 mt-24">
        <div class="card">
          <div class="card-header">
            <div class="card-title"><span class="material-icons icon">pending_actions</span> 紧急待办</div>
            <a routerLink="/admin/reviews" style="font-size:12px;color:#3b82f6">全部 →</a>
          </div>
          <mat-list dense>
            <mat-list-item style="height:auto;padding:12px 0;border-bottom:1px solid #f1f5f9">
              <span class="material-icons" style="color:#ef4444;margin-right:12px">report_problem</span>
              <div>
                <div style="font-weight:600">高优先级待审核 {{ data?.todos?.pendingReview || 0 }} 人</div>
                <div style="font-size:12px;color:#64748b">超过 12 小时未处理</div>
              </div>
            </mat-list-item>
            <mat-list-item style="height:auto;padding:12px 0;border-bottom:1px solid #f1f5f9">
              <span class="material-icons" style="color:#f59e0b;margin-right:12px">money_off</span>
              <div>
                <div style="font-weight:600">退款申请待处理 {{ data?.todos?.pendingRefunds || 0 }} 笔</div>
                <div style="font-size:12px;color:#64748b">超时将自动触发</div>
              </div>
            </mat-list-item>
            <mat-list-item style="height:auto;padding:12px 0">
              <span class="material-icons" style="color:#f59e0b;margin-right:12px">error_outline</span>
              <div>
                <div style="font-weight:600">到场缺口 {{ data?.todos?.gapTodos || 0 }} 人</div>
                <div style="font-size:12px;color:#64748b">含高价值候选人需补位</div>
              </div>
            </mat-list-item>
          </mat-list>
        </div>
        <div class="card" style="grid-column: span 2">
          <div class="card-header">
            <div class="card-title"><span class="material-icons icon">local_activity</span> 票种库存监控</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px">
            <div *ngFor="let t of data?.tickets || []" class="ticket-card">
              <div class="flex-between">
                <strong style="font-size:15px">{{ t.name }}</strong>
                <span class="chip" [ngClass]="t.isOnSale ? 'chip-approved' : 'chip-closed'">
                  {{ t.isOnSale ? '在售' : '停售' }}
                </span>
              </div>
              <div class="mt-8 mb-8">
                <div class="flex-between mb-4" style="font-size:12px;color:#64748b">
                  <span>已售 {{ t.soldCount }}</span>
                  <span>剩余 {{ t.totalInventory - t.soldCount }}</span>
                </div>
                <mat-progress-bar mode="determinate"
                  [value]="(t.soldCount / t.totalInventory * 100)"
                  [color]="(t.soldCount / t.totalInventory) > 0.9 ? 'warn' : (t.soldCount / t.totalInventory) > 0.7 ? 'accent' : 'primary'"
                  style="height:8px;border-radius:4px">
                </mat-progress-bar>
              </div>
              <div class="flex-between" style="font-size:13px">
                <span style="color:#64748b">单价</span>
                <strong style="color:#be123c">¥{{ t.price.toFixed(0) }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardPage implements OnInit {
  data: any = null;
  updateTime = '-';
  trendOption: any = {}; ticketOption: any = {};

  constructor(public api: ApiService) {}
  async ngOnInit() { await this.load(); }
  formatNum(n: number) { return Number(n).toLocaleString('zh-CN'); }

  async load() {
    this.data = await firstValueFrom(this.api.dashboardKpi()) as any;
    this.updateTime = new Date().toLocaleTimeString('zh-CN');
    this.trendOption = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['提交报名', '审核通过'] },
      grid: { left: 40, right: 20, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: (this.data.daily || []).map((d: any) => d.day.slice(5)) },
      yAxis: { type: 'value' },
      series: [
        { name: '提交报名', type: 'line', smooth: true, data: (this.data.daily || []).map((d: any) => d.total),
          lineStyle: { color: '#3b82f6', width: 3 }, areaStyle: { color: 'rgba(59,130,246,.15)' },
          itemStyle: { color: '#3b82f6' } },
        { name: '审核通过', type: 'line', smooth: true, data: (this.data.daily || []).map((d: any) => d.passed),
          lineStyle: { color: '#10b981', width: 3 }, areaStyle: { color: 'rgba(16,185,129,.15)' },
          itemStyle: { color: '#10b981' } },
      ],
    };
    const tickets = this.data.tickets || [];
    this.ticketOption = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie', radius: ['50%', '75%'], center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { formatter: '{b}\n{d}%' },
        data: tickets.map((t: any, i: number) => ({
          value: t.soldCount, name: t.name,
          itemStyle: { color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7'][i % 5] },
        })),
      }],
      graphic: [{ type: 'text', left: 'center', top: '38%',
        style: { text: '总计\n' + tickets.reduce((a: number, b: any) => a + b.soldCount, 0),
          textAlign: 'center', fontSize: 14, fontWeight: 700, fill: '#0f172a', lineHeight: 22 } }],
    };
  }
}
