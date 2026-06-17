import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'guests-page',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <div class="page-title">👥 嘉宾名额管理</div>
          <div class="page-subtitle">管理定向邀约嘉宾的专属配额、分配记录和优先级标记</div>
        </div>
        <button mat-raised-button color="primary" (click)="showAdd=true"><span class="material-icons">person_add</span> 新增嘉宾</button>
      </div>

      <div *ngIf="showAdd" class="card mb-24">
        <form class="grid grid-4 gap-12">
          <mat-form-field appearance="outline"><mat-label>嘉宾姓名</mat-label><input matInput [(ngModel)]="nf.name" name="name"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>公司/机构</mat-label><input matInput [(ngModel)]="nf.company" name="company"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>总配额</mat-label><input matInput type="number" [(ngModel)]="nf.totalQuota" name="q"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>优先级</mat-label>
            <mat-select [(ngModel)]="nf.priorityLevel" name="p">
              <mat-option [value]="1">★ 最高</mat-option>
              <mat-option [value]="2">★★ 高</mat-option>
              <mat-option [value]="3">普通</mat-option>
            </mat-select>
          </mat-form-field>
        </form>
        <div class="flex mt-16 gap-8" style="justify-content:flex-end">
          <button mat-stroked-button (click)="showAdd=false">取消</button>
          <button mat-raised-button color="primary" (click)="save()">创建</button>
        </div>
      </div>

      <div class="grid grid-3 gap-16">
        <div *ngFor="let g of guests" class="g-card">
          <div class="g-head">
            <div class="g-avatar" [class.p1]="g.priorityLevel===1" [class.p2]="g.priorityLevel===2">
              {{ g.name.charAt(0) }}
            </div>
            <div style="flex:1">
              <div style="font-weight:700;font-size:16px;display:flex;align-items:center;gap:6px">
                {{ g.name }}
                <span *ngIf="g.priorityLevel===1" class="chip chip-closed">TOP</span>
                <span *ngIf="g.priorityLevel===2" class="chip chip-pending">优先</span>
              </div>
              <div style="font-size:12px;color:#64748b;margin-top:2px">{{ g.company }}</div>
            </div>
          </div>
          <div class="g-quota">
            <div style="position:relative;width:140px;height:140px;margin:0 auto">
              <svg viewBox="0 0 120 120" style="width:100%;height:100%;transform:rotate(-90deg)">
                <circle cx="60" cy="60" r="48" fill="none" stroke="#e2e8f0" stroke-width="12"/>
                <circle cx="60" cy="60" r="48" fill="none" stroke="url(#grad)" stroke-width="12"
                  stroke-linecap="round" [attr.stroke-dasharray]="301.6 * (g.usedQuota / g.totalQuota) + ' 301.6'"/>
                <defs><linearGradient id="grad"><stop offset="0" stop-color="#3b82f6"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs>
              </svg>
              <div class="g-quota-center">
                <div style="font-size:28px;font-weight:800;color:#1e3a8a">{{ g.usedQuota }}/{{ g.totalQuota }}</div>
                <div style="font-size:11px;color:#64748b">已用/配额</div>
              </div>
            </div>
          </div>
          <div class="g-info">
            <div class="flex-between mb-8">
              <span style="color:#64748b">剩余名额</span>
              <strong [style.color]="(g.totalQuota-g.usedQuota)<=5?'#dc2626':'#059669'">{{ g.totalQuota - g.usedQuota }}</strong>
            </div>
            <div class="flex gap-8">
              <button mat-stroked-button style="flex:1" (click)="adjustQuota(g)">
                <span class="material-icons">tune</span> 调配额
              </button>
              <button mat-raised-button color="primary" style="flex:1" [disabled]="g.usedQuota>=g.totalQuota" (click)="openAllocate(g)">
                <span class="material-icons">send</span> 分配
              </button>
            </div>
          </div>
          <div class="g-history mt-16" *ngIf="expandId===g.id">
            <div style="font-weight:600;font-size:13px;margin-bottom:12px">分配历史</div>
            <ng-container *ngIf="(allocs[g.id]||[]).length">
              <div *ngFor="let a of allocs[g.id]" class="h-item">
                <div class="h-prio" [class.p1]="a.priority===1">P{{ a.priority }}</div>
                <div style="flex:1">
                  <div style="font-weight:600;font-size:13px">{{ a.registration.user.name }} · {{ a.registration.user.company }}</div>
                  <div style="font-size:11px;color:#64748b">{{ a.registration.orderNo }} · {{ formatTime(a.createdAt) }}</div>
                  <div *ngIf="a.note" style="font-size:11px;color:#3b82f6;margin-top:2px">📝 {{ a.note }}</div>
                </div>
              </div>
            </ng-container>
            <div *ngIf="!(allocs[g.id]||[]).length" style="color:#94a3b8;text-align:center;padding:16px;font-size:12px">暂无分配记录</div>
          </div>
          <button mat-button style="width:100%;margin-top:8px;font-size:12px;color:#3b82f6" (click)="toggleExpand(g)">
            {{ expandId===g.id ? '收起' : '查看分配记录' }} ({{g._count?.allocations||0}})
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .g-card { background:white;border-radius:16px;padding:24px;box-shadow:var(--shadow-sm);border:1px solid #e2e8f0; }
    .g-head { display:flex;align-items:center;gap:12px;margin-bottom:16px; }
    .g-avatar { width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px; }
    .g-avatar.p1 { background:linear-gradient(135deg,#be123c,#f43f5e);box-shadow:0 0 0 3px #fecdd3; }
    .g-avatar.p2 { background:linear-gradient(135deg,#b45309,#f59e0b); }
    .g-quota { position:relative;margin:8px 0 16px; }
    .g-quota-center { position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center; }
    .h-item { padding:10px 12px;background:#f8fafc;border-radius:8px;margin-bottom:6px;display:flex;gap:10px;align-items:flex-start; }
    .h-prio { width:24px;height:24px;border-radius:6px;background:#1e3a8a;color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:10px;flex-shrink:0;margin-top:2px; }
    .h-prio.p1 { background:#be123c; }
  `],
})
export class GuestsPage implements OnInit {
  guests: any[] = []; showAdd = false; expandId: any = null; allocs: Record<string, any[]> = {};
  nf: any = { name: '', company: '', totalQuota: 3, priorityLevel: 2 };
  constructor(public api: ApiService) {}
  formatTime(t: any) { return t ? new Date(t).toLocaleString('zh-CN') : ''; }
  async ngOnInit() { await this.load(); }
  async load() { this.guests = await firstValue(this.api.listGuests()) as any[]; }
  async save() {
    if (!this.nf.name) { this.api.toast('请填写嘉宾姓名', 'error'); return; }
    await firstValue(this.api.createGuest(this.nf));
    this.api.toast('创建成功'); this.showAdd = false; this.nf = { name: '', company: '', totalQuota: 3, priorityLevel: 2 };
    this.load();
  }
  adjustQuota(g: any) {
    const n = prompt('设置新的总配额数', String(g.totalQuota));
    if (n && !isNaN(+n)) {
      this.api.updateGuestQuota(g.id, +n).subscribe(() => { this.api.toast('配额已更新'); this.load(); });
    }
  }
  openAllocate(g: any) {
    const id = prompt('输入要分配的报名记录ID（registrationId）');
    if (id) {
      this.api.allocateGuest(g.id, { registrationId: id, priority: g.priorityLevel, note: '运营分配' })
        .subscribe(() => { this.api.toast('分配成功'); this.load(); },
          (e: any) => this.api.toast(e.error?.message || '失败', 'error'));
    }
  }
  async toggleExpand(g: any) {
    if (this.expandId === g.id) { this.expandId = null; return; }
    this.expandId = g.id;
    this.allocs[g.id] = await firstValue(this.api.listGuestAllocations(g.id)) as any[];
  }
}
function firstValue(o: any) { return (o as any).pipe ? (o as any).toPromise() : Promise.resolve(o); }
