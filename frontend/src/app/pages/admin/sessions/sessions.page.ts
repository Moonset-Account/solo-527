import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'sessions-page',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <div class="page-title">🪑 座位场次维护</div>
          <div class="page-subtitle">配置场次信息、座位状态管理、设置质量权重（关联报名质量评分）</div>
        </div>
        <button mat-raised-button color="primary"><span class="material-icons">add</span> 新增场次</button>
      </div>

      <div class="grid grid-3 gap-16 mb-24">
        <div *ngFor="let s of sessions;let i=index" class="session-card"
          [class.active]="activeIdx===i" (click)="selectSession(s, i)">
          <div class="flex-between">
            <div>
              <div style="font-weight:700;font-size:16px">{{ s.name }}</div>
              <div style="font-size:12px;color:#64748b;margin-top:4px">
                <span class="material-icons" style="font-size:14px;vertical-align:-2px">schedule</span>
                {{ formatDate(s.startTime) }} - {{ formatTime(s.endTime) }}
              </div>
            </div>
            <span class="chip" [ngClass]="s.isActive?'chip-approved':'chip-closed'">
              {{ s.isActive ? '进行中' : '已结束' }}
            </span>
          </div>
          <div class="s-info mt-16">
            <div><span class="material-icons">location_on</span> {{ s.venue }}</div>
            <div><span class="material-icons">people</span> 容量 {{ s.capacity }} 人</div>
            <div><span class="material-icons">stars</span> 质量权重 x{{ s.qualityWeight }}</div>
          </div>
        </div>
      </div>

      <div class="card" *ngIf="selected">
        <div class="card-header">
          <div class="card-title">
            <span class="material-icons icon">event_seat</span>
            {{ selected.name }} · 座位分布图
          </div>
          <div class="flex gap-12" style="align-items:center">
            <div>质量权重：</div>
            <mat-form-field appearance="outline" style="width:120px;margin:0">
              <mat-select [(value)]="selected.qualityWeight" (selectionChange)="updateWeight()">
                <mat-option [value]="0.8">0.8x (低)</mat-option>
                <mat-option [value]="1.0">1.0x (标准)</mat-option>
                <mat-option [value]="1.2">1.2x (较高)</mat-option>
                <mat-option [value]="1.5">1.5x (核心)</mat-option>
              </mat-select>
            </mat-form-field>
            <span style="font-size:12px;color:#64748b">权重影响报名质量评分</span>
          </div>
        </div>

        <div class="zone-stats" *ngIf="seatData">
          <div *ngFor="let st of Object.entries(seatData.stats)" class="z-card">
            <div class="z-name">{{ st[0] }} 区</div>
            <div class="z-nums">
              <span class="avail">{{ st[1].available }}<small>可选</small></span>
              <span class="sold">{{ st[1].sold }}<small>已售</small></span>
              <span class="lock">{{ st[1].locked }}<small>锁定</small></span>
            </div>
          </div>
        </div>

        <div class="seatmap-wrap" *ngIf="seatData">
          <div class="sm-stage">{{ selected.venue.toUpperCase() }} · 舞 台</div>
          <div *ngFor="let zone of seatData.zones" class="sm-zone">
            <div class="sm-zone-title">{{ zone }} 区</div>
            <div class="sm-rows" *ngFor="let row of groupByZone(zone)">
              <div class="sm-row-label">{{ row[0].row }}</div>
              <div *ngFor="let s of row" class="sm-seat"
                [class.available]="s.status==='available'" [class.sold]="s.status==='sold'" [class.locked]="s.status==='locked'"
                [class.selected]="selectedSeatId===s.id"
                (click)="s.status!=='sold' && selectSeat(s)">
                {{ s.number }}
              </div>
            </div>
          </div>
        </div>

        <div class="mt-24" *ngIf="selectedSeatId">
          <div style="font-weight:600;margin-bottom:12px">座位操作：{{ currentSeat?.row }}排{{ currentSeat?.number }}座 ({{ currentSeat?.zone }}区)</div>
          <div class="flex gap-8">
            <button mat-stroked-button (click)="setSeat('available')" [disabled]="currentSeat?.status==='available'">
              <span class="material-icons">lock_open</span> 释放
            </button>
            <button mat-raised-button color="warn" (click)="setSeat('locked')" [disabled]="currentSeat?.status==='locked'">
              <span class="material-icons">lock</span> 锁定（预留）
            </button>
          </div>
        </div>

        <div class="sm-legend mt-16">
          <span><i class="avail"></i> 可选</span>
          <span><i class="sold-i"></i> 已售</span>
          <span><i class="locked-i"></i> 锁定</span>
          <span><i class="sel-i"></i> 选中</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .session-card { padding:20px;background:white;border-radius:14px;border:2px solid transparent;cursor:pointer;transition:.2s;box-shadow:var(--shadow-sm); }
    .session-card:hover { box-shadow:var(--shadow-md); }
    .session-card.active { border-color:#3b82f6;background:linear-gradient(180deg,#eff6ff,#ffffff); }
    .s-info { display:flex;gap:16px;color:#64748b;font-size:12px;flex-wrap:wrap; }
    .s-info .material-icons { font-size:14px;vertical-align:-2px;margin-right:4px;color:#3b82f6; }
    .zone-stats { display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:24px; }
    .z-card { padding:14px 18px;background:linear-gradient(135deg,#f0f9ff,#ffffff);border-radius:12px;border:1px solid #bae6fd; }
    .z-name { font-weight:700;color:#0369a1;margin-bottom:8px; }
    .z-nums { display:flex;gap:16px;font-size:18px;font-weight:800; }
    .z-nums small { font-size:10px;font-weight:400;color:#64748b;display:block; }
    .z-nums .avail { color:#059669; } .z-nums .sold { color:#64748b; } .z-nums .lock { color:#d97706; }
    .sm-stage { text-align:center;padding:16px;background:linear-gradient(90deg,#1e3a8a,#2563eb,#3b82f6);
      color:white;border-radius:10px;margin-bottom:32px;font-weight:700;letter-spacing:8px;
      clip-path:polygon(5% 0,95% 0,100% 100%,0 100%); }
    .sm-zone { margin-bottom:24px; }
    .sm-zone-title { font-size:12px;color:#64748b;font-weight:600;margin-bottom:8px;padding-left:40px; }
    .sm-rows { display:flex;gap:6px;align-items:center;margin-bottom:6px;justify-content:center; }
    .sm-row-label { width:36px;font-size:11px;color:#94a3b8;text-align:right;padding-right:8px; }
    .sm-seat { width:28px;height:22px;border-radius:5px 5px 2px 2px;background:#10b98120;border:1px solid #10b98160;
      display:flex;align-items:center;justify-content:center;font-size:10px;color:#047857;cursor:pointer;transition:.15s; }
    .sm-seat.available:hover { background:#10b981;color:white;transform:scale(1.15); }
    .sm-seat.sold { background:#f1f5f9;border-color:#e2e8f0;color:#cbd5e1;cursor:not-allowed; }
    .sm-seat.locked { background:#f59e0b20;border-color:#f59e0b60;color:#b45309; }
    .sm-seat.selected { background:#3b82f6 !important;color:white;border-color:#1d4ed8;box-shadow:0 0 0 3px #3b82f640; }
    .sm-legend { display:flex;gap:24px;justify-content:center;font-size:12px;color:#64748b;padding-top:16px;border-top:1px dashed #e2e8f0; }
    .sm-legend i { display:inline-block;width:14px;height:11px;border-radius:3px;margin-right:5px;vertical-align:middle; }
    .sm-legend .avail { background:#10b98120;border:1px solid #10b98160; }
    .sm-legend .sold-i { background:#f1f5f9;border:1px solid #e2e8f0; }
    .sm-legend .locked-i { background:#f59e0b20;border:1px solid #f59e0b60; }
    .sm-legend .sel-i { background:#3b82f6; }
  `],
})
export class SessionsPage implements OnInit {
  sessions: any[] = []; selected: any = null; activeIdx = 0;
  seatData: any = null; selectedSeatId: any = null;
  constructor(public api: ApiService) {}
  get currentSeat() { return this.seatData?.seats.find((s: any) => s.id === this.selectedSeatId); }
  async ngOnInit() {
    this.sessions = await firstValue(this.api.listSessions(false)) as any[];
    if (this.sessions.length) this.selectSession(this.sessions[0], 0);
  }
  formatDate(d: any) { return new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' }); }
  formatTime(d: any) { return new Date(d).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }); }
  async selectSession(s: any, idx: number) {
    this.selected = s; this.activeIdx = idx; this.selectedSeatId = null;
    this.seatData = await firstValue(this.api.getSeats(s.id)) as any;
  }
  groupByZone(zone: string) {
    const byRow = new Map<string, any[]>();
    (this.seatData.seats.filter((s: any) => s.zone === zone)).forEach((s: any) => {
      if (!byRow.has(s.row)) byRow.set(s.row, []);
      byRow.get(s.row)!.push(s);
    });
    return Array.from(byRow.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([_, r]) => r.sort((a, b) => a.number.localeCompare(b.number)));
  }
  selectSeat(s: any) { this.selectedSeatId = this.selectedSeatId === s.id ? null : s.id; }
  async setSeat(status: string) {
    if (!this.selected || !this.currentSeat) return;
    try {
      await firstValue(this.api.updateSeat(this.selected.id, this.currentSeat.id, { status }));
      this.currentSeat.status = status;
      this.api.toast('座位状态已更新');
    } catch (e: any) { this.api.toast(e.error?.message || '失败', 'error'); }
  }
  async updateWeight() {
    try {
      await firstValue(this.api.setSessionQuality(this.selected.id, this.selected.qualityWeight));
      this.api.toast('质量权重已更新');
    } catch {}
  }
}
function firstValue(o: any) { return (o as any).pipe ? (o as any).toPromise() : Promise.resolve(o); }
