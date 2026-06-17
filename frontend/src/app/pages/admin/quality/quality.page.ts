import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'quality-page',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <div class="page-title">📊 报名质量统计</div>
          <div class="page-subtitle">多维度分析报名质量，辅助渠道投入和嘉宾邀约决策</div>
        </div>
        <div class="flex gap-8">
          <mat-button-toggle-group [(value)]="dimension" (change)="load()">
            <mat-button-toggle value="channel">渠道来源</mat-button-toggle>
            <mat-button-toggle value="ticketType">票种级别</mat-button-toggle>
            <mat-button-toggle value="session">场次质量</mat-button-toggle>
          </mat-button-toggle-group>
        </div>
      </div>

      <div class="grid grid-4 gap-16 mb-24">
        <kpi-card label="平均质量分" [value]="avgScore" theme="indigo" [sub]="'参评 ' + totalSamples + ' 人'"></kpi-card>
        <kpi-card label="优质参会者(≥85)" [value]="highCount" theme="emerald" [sub]="'占比 ' + highPct + '%'"></kpi-card>
        <kpi-card label="渠道ROI最优" [value]="bestChannel" theme="violet"></kpi-card>
        <kpi-card label="需优化渠道" [value]="worstChannel" theme="rose"></kpi-card>
      </div>

      <div class="grid grid-2 gap-24 mb-24">
        <div class="card">
          <div class="card-header">
            <div class="card-title"><span class="material-icons icon">bar_chart</span>
              {{ {channel:'渠道来源',ticketType:'票种级别',session:'场次质量'}[dimension] }} - 质量对比
            </div>
          </div>
          <div echarts [options]="barOption" style="height:340px"></div>
        </div>
        <div class="card">
          <div class="card-header">
            <div class="card-title"><span class="material-icons icon">bubble_chart</span> 渠道质量气泡图</div>
            <span style="font-size:12px;color:#64748b">X:通过率 · Y:到场率 · 大小:人数</span>
          </div>
          <div echarts [options]="bubbleOption" style="height:340px"></div>
        </div>
      </div>

      <div class="card mb-24">
        <div class="card-header">
          <div class="card-title"><span class="material-icons icon">donut_large</span> 质量分数分布</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 400px;gap:24px;align-items:center">
          <div class="dist-list">
            <div *ngFor="let d of dist" class="dist-item">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <span style="font-weight:600;color:{{d.color}}">{{ d.range }} 分 · {{ d.label }}</span>
                <span style="font-weight:700;font-size:18px">{{ d.count }} 人</span>
              </div>
              <div style="height:14px;background:#f1f5f9;border-radius:7px;overflow:hidden">
                <div [style.width]="(d.count/totalSamples*100)+'%'"
                  [style.background]="d.color"
                  style="height:100%;border-radius:7px;transition:1s"></div>
              </div>
              <div style="font-size:11px;color:#64748b;margin-top:4px;text-align:right">
                {{ (d.count/totalSamples*100).toFixed(1) }}%
              </div>
            </div>
          </div>
          <div echarts [options]="pieOption" style="height:300px"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title"><span class="material-icons icon">table_chart</span>
            {{ dimension==='channel' ? '渠道质量明细' : dimension==='ticketType' ? '票种级别明细' : '场次质量明细' }}
          </div>
          <button mat-stroked-button><span class="material-icons">download</span> 导出报表</button>
        </div>
        <table mat-table [dataSource]="tableData" style="width:100%">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>名称</th>
            <td mat-cell *matCellDef="let r" style="font-weight:600">{{ r.name }}</td>
          </ng-container>
          <ng-container matColumnDef="count">
            <th mat-header-cell *matHeaderCellDef>人数</th>
            <td mat-cell *matCellDef="let r">{{ r.count }}</td>
          </ng-container>
          <ng-container matColumnDef="avgScore">
            <th mat-header-cell *matHeaderCellDef>均分</th>
            <td mat-cell *matCellDef="let r">
              <span [style.color]="r.avgScore>=80?'#059669':r.avgScore>=70?'#0369a1':'#d97706'" style="font-weight:700">
                {{ r.avgScore }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="passRate">
            <th mat-header-cell *matHeaderCellDef>审核通过率</th>
            <td mat-cell *matCellDef="let r">
              <div style="display:flex;align-items:center;gap:8px">
                <mat-progress-bar mode="determinate" [value]="r.passRate" style="width:100px"></mat-progress-bar>
                <span style="font-size:12px">{{ r.passRate }}%</span>
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="checkInRate">
            <th mat-header-cell *matHeaderCellDef>到场率</th>
            <td mat-cell *matCellDef="let r">
              <div style="display:flex;align-items:center;gap:8px">
                <mat-progress-bar mode="determinate" [value]="r.checkInRate" color="accent" style="width:100px"></mat-progress-bar>
                <span style="font-size:12px">{{ r.checkInRate }}%</span>
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="revenue">
            <th mat-header-cell *matHeaderCellDef *ngIf="dimension==='ticketType'">营收(元)</th>
            <td mat-cell *matCellDef="let r" style="font-weight:600;color:#be123c">
              {{ dimension==='ticketType' ? '¥'+ r.revenue.toLocaleString('zh-CN') : '-' }}
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let r; columns: cols" class="row-hover"></tr>
        </table>
      </div>
    </div>
  `,
  styles: [`.dist-item { padding:12px 16px;background:#f8fafc;border-radius:10px;margin-bottom:10px; }
    .row-hover:hover { background:#f8fafc; }`],
})
export class QualityPage implements OnInit {
  dimension = 'channel';
  avgScore = 0; totalSamples = 0; highCount = 0; highPct = 0;
  bestChannel = '-'; worstChannel = '-';
  dist: any[] = [];
  barOption: any = {}; bubbleOption: any = {}; pieOption: any = {};
  tableData: any[] = [];
  get cols() {
    const c = ['name', 'count', 'avgScore', 'passRate', 'checkInRate'];
    if (this.dimension === 'ticketType') c.push('revenue');
    return c;
  }
  constructor(public api: ApiService) {}
  async ngOnInit() { await this.load(); }
  async load() {
    const res: any = await firstValue(this.api.qualityStats({ dimension: this.dimension }));
    this.tableData = res.data || [];
    this.dist = res.scoreDistribution || [];
    this.totalSamples = this.dist.reduce((a: number, b: any) => a + b.count, 0);
    this.avgScore = this.totalSamples ? Math.round(this.dist.reduce((a: number, b: any) => a + (b.count * this.scoreMid(b.range)), 0) / this.totalSamples) : 0;
    this.highCount = (this.dist[0]?.count || 0) + (this.dist[1]?.count || 0);
    this.highPct = this.totalSamples ? Math.round(this.highCount / this.totalSamples * 100) : 0;
    if (this.tableData.length) {
      const sorted = [...this.tableData].sort((a, b) => b.avgScore - a.avgScore);
      this.bestChannel = sorted[0]?.name || '-';
      this.worstChannel = sorted[sorted.length - 1]?.name || '-';
    }
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#ec4899'];
    this.barOption = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['人数', '均分', '通过率%', '到场率%'] },
      grid: { left: 40, right: 40, top: 40, bottom: 60 },
      xAxis: { type: 'category', data: this.tableData.map((r: any) => r.name), axisLabel: { rotate: this.dimension !== 'ticketType' ? 15 : 0 } },
      yAxis: [{ type: 'value', name: '人数' }, { type: 'value', name: '分数/率', max: 120 }],
      series: [
        { name: '人数', type: 'bar', data: this.tableData.map((r: any) => r.count), itemStyle: { color: colors[0] }, barWidth: 20 },
        { name: '均分', type: 'line', yAxisIndex: 1, data: this.tableData.map((r: any) => r.avgScore), smooth: true, itemStyle: { color: colors[1] }, lineStyle: { width: 3 } },
        { name: '通过率%', type: 'line', yAxisIndex: 1, data: this.tableData.map((r: any) => r.passRate), smooth: true, itemStyle: { color: colors[2] } },
        { name: '到场率%', type: 'line', yAxisIndex: 1, data: this.tableData.map((r: any) => r.checkInRate), smooth: true, itemStyle: { color: colors[4] } },
      ],
    };
    this.bubbleOption = {
      tooltip: { formatter: (p: any) => `${p.data[3]}<br/>人数:${p.data[2]}<br/>通过率:${p.data[0]}%<br/>到场率:${p.data[1]}%` },
      grid: { left: 50, right: 20, top: 20, bottom: 40 },
      xAxis: { name: '通过率(%)', type: 'value', min: 0, max: 100 },
      yAxis: { name: '到场率(%)', type: 'value', min: 0, max: 100 },
      series: [{
        type: 'scatter', symbolSize: d => Math.sqrt(d[2]) * 8,
        data: this.tableData.map((r: any, i: number) => [r.passRate || 60, r.checkInRate || 50, r.count, r.name, colors[i % colors.length]]),
        itemStyle: { color: (p: any) => p.data[4], opacity: .75, borderColor: '#fff', borderWidth: 2 },
      }],
    };
    this.pieOption = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', left: 10, top: 'center' },
      series: [{
        type: 'pie', radius: ['45%', '75%'], center: ['65%', '50%'],
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { formatter: '{b}\n{d}%' },
        data: this.dist.map((d: any) => ({ value: d.count, name: d.label + `(${d.range})`, itemStyle: { color: d.color } })),
      }],
    };
  }
  scoreMid(range: string) {
    const [a, b] = range.split('-').map(Number);
    return (a + b) / 2;
  }
}
function firstValue(o: any) { return (o as any).pipe ? (o as any).toPromise() : Promise.resolve(o); }
