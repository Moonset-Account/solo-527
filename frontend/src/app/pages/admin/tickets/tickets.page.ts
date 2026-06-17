import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../../services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'tickets-page',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <div class="page-title">🎟 票种库存管理</div>
          <div class="page-subtitle">维护票种信息、价格策略、库存余量及停售/开售状态</div>
        </div>
        <button mat-raised-button color="primary" (click)="showAdd=true"><span class="material-icons">add</span> 新增票种</button>
      </div>

      <div *ngIf="showAdd" class="card mb-24" style="background:#f0f9ff;border-color:#bae6fd">
        <div class="flex-between mb-12">
          <div style="font-weight:700;color:#0369a1">{{ editing ? '编辑票种' : '新增票种' }}</div>
          <button mat-icon-button (click)="showAdd=false;editing=null"><span class="material-icons">close</span></button>
        </div>
        <form [formGroup]="form" class="grid grid-3 gap-12">
          <mat-form-field appearance="outline"><mat-label>票种名称</mat-label><input matInput formControlName="name"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>级别</mat-label>
            <mat-select formControlName="level">
              <mat-option value="normal">普通</mat-option>
              <mat-option value="vip">VIP</mat-option>
              <mat-option value="guest">嘉宾专属</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>价格(元)</mat-label><input matInput type="number" formControlName="price"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>总库存</mat-label><input matInput type="number" formControlName="totalInventory"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>预警阈值</mat-label><input matInput type="number" formControlName="warningThreshold"></mat-form-field>
          <mat-form-field appearance="outline" style="grid-column:span 3">
            <mat-label>票种说明</mat-label><textarea matInput formControlName="description" rows="2"></textarea>
          </mat-form-field>
        </form>
        <div class="flex mt-16 gap-8" style="justify-content:flex-end">
          <button mat-stroked-button (click)="showAdd=false">取消</button>
          <button mat-raised-button color="primary" (click)="saveTicket()">{{ editing ? '保存' : '创建' }}</button>
        </div>
      </div>

      <div class="grid grid-3 gap-16">
        <div *ngFor="let t of tickets" class="ticket-card">
          <div class="tc-header" [class.vip]="t.level==='vip'" [class.guest]="t.level==='guest'">
            <div>
              <div class="tc-name">{{ t.name }}</div>
              <div class="tc-level">
                <span class="chip" [ngClass]="t.level==='vip'?'chip-paid':t.level==='guest'?'chip-closed':'chip-approved'">{{ t.level.toUpperCase() }}</span>
                <span class="chip" [ngClass]="t.isOnSale?'chip-approved':'chip-closed'">{{ t.isOnSale ? '在售' : '停售' }}</span>
              </div>
            </div>
            <div class="tc-price">¥{{ t.price.toFixed(0) }}<span *ngIf="t.price==0" style="font-size:12px">免费</span></div>
          </div>
          <div class="tc-body">
            <div class="flex-between mb-8" style="font-size:12px;color:#64748b">
              <span>售出 <strong style="color:#0f172a">{{ t.soldCount }}</strong></span>
              <span>剩余 <strong style="color:{{(t.totalInventory-t.soldCount)<=t.warningThreshold?'#dc2626':'#059669'}}">{{ t.totalInventory - t.soldCount }}</strong></span>
            </div>
            <mat-progress-bar mode="determinate" [value]="t.soldCount/t.totalInventory*100"
              [color]="(t.soldCount/t.totalInventory)>0.9?'warn':(t.soldCount/t.totalInventory)>0.7?'accent':'primary'"
              style="height:10px;border-radius:5px"></mat-progress-bar>
            <div *ngIf="(t.totalInventory-t.soldCount)<=t.warningThreshold" class="warn mt-8">
              ⚠ 库存低于预警阈值 {{ t.warningThreshold }}
            </div>
            <p class="tc-desc mt-12">{{ t.description }}</p>
          </div>
          <div class="tc-actions">
            <button mat-stroked-button (click)="edit(t)"><span class="material-icons">edit</span> 编辑</button>
            <button mat-stroked-button (click)="openAdjust(t)"><span class="material-icons">inventory_2</span> 调库存</button>
            <button mat-raised-button [color]="t.isOnSale?'warn':'primary'" (click)="toggleStatus(t)">
              {{ t.isOnSale ? '停售' : '开售' }}
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="adjustTarget" class="mt-24 card">
        <div class="card-header">
          <div class="card-title">📝 库存调整 - {{ adjustTarget.name }}</div>
          <button mat-icon-button (click)="adjustTarget=null"><span class="material-icons">close</span></button>
        </div>
        <div class="grid grid-4 gap-12">
          <div style="padding:12px;background:#f8fafc;border-radius:8px">当前总量 <strong style="font-size:18px">{{ adjustTarget.totalInventory }}</strong></div>
          <div style="padding:12px;background:#f8fafc;border-radius:8px">已售 <strong style="font-size:18px">{{ adjustTarget.soldCount }}</strong></div>
          <mat-form-field appearance="outline" style="margin:0">
            <mat-label>调整数量(正=增加，负=减少)</mat-label>
            <input matInput type="number" [(ngModel)]="adjustDelta">
          </mat-form-field>
          <div style="display:flex;gap:8px;align-items:flex-end">
            <button mat-stroked-button (click)="adjustTarget=null">取消</button>
            <button mat-raised-button color="primary" (click)="applyAdjust()" [disabled]="!adjustDelta">确认调整</button>
          </div>
        </div>
        <mat-form-field appearance="outline" class="full mt-12" style="margin:0">
          <mat-label>调整原因 *</mat-label>
          <input matInput [(ngModel)]="adjustReason" placeholder="请填写调整原因，用于审计追溯">
        </mat-form-field>
      </div>
    </div>
  `,
  styles: [`
    .ticket-card { background:white;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;transition:.2s; }
    .ticket-card:hover { box-shadow:0 12px 24px rgba(0,0,0,.08);transform:translateY(-4px); }
    .tc-header { padding:20px 24px;background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:white;display:flex;justify-content:space-between;align-items:center; }
    .tc-header.vip { background:linear-gradient(135deg,#7c2d12,#f59e0b); }
    .tc-header.guest { background:linear-gradient(135deg,#581c87,#a855f7); }
    .tc-name { font-size:18px;font-weight:700; }
    .tc-level { margin-top:6px;display:flex;gap:6px; }
    .tc-price { font-size:28px;font-weight:800; }
    .tc-body { padding:20px 24px; }
    .warn { padding:8px 12px;background:#fef2f2;border-radius:8px;color:#991b1b;font-size:12px; }
    .tc-desc { color:#64748b;font-size:12px;line-height:1.6; }
    .tc-actions { padding:12px 24px 20px;display:flex;gap:8px; }
    .tc-actions button { flex:1;font-size:12px; }
  `],
})
export class TicketsPage implements OnInit {
  tickets: any[] = [];
  showAdd = false; editing: any = null; form: FormGroup;
  adjustTarget: any = null; adjustDelta = 0; adjustReason = '';
  constructor(private fb: FormBuilder, public api: ApiService) {
    this.form = fb.group({
      name: ['', Validators.required], level: ['normal'],
      price: [0, Validators.required], totalInventory: [100, Validators.required],
      warningThreshold: [10], description: [''],
    });
  }
  async ngOnInit() { this.tickets = await firstValue(this.api.listTickets(true)) as any[]; }
  edit(t: any) {
    this.editing = t; this.showAdd = true;
    this.form.patchValue({ name: t.name, level: t.level, price: t.price, totalInventory: t.totalInventory, warningThreshold: t.warningThreshold, description: t.description });
  }
  async saveTicket() {
    if (!this.form.valid) return;
    try {
      if (this.editing) {
        await firstValue(this.api.updateTicket(this.editing.id, this.form.value));
        this.api.toast('更新成功');
      } else {
        await firstValue(this.api.createTicket(this.form.value));
        this.api.toast('创建成功');
      }
      this.showAdd = false; this.editing = null;
      this.tickets = await firstValue(this.api.listTickets(true)) as any[];
    } catch (e: any) { this.api.toast(e.error?.message || '失败', 'error'); }
  }
  async toggleStatus(t: any) {
    await firstValue(this.api.setTicketStatus(t.id, !t.isOnSale));
    t.isOnSale = !t.isOnSale;
    this.api.toast(t.isOnSale ? '已开售' : '已停售');
  }
  openAdjust(t: any) { this.adjustTarget = t; this.adjustDelta = 0; this.adjustReason = ''; }
  async applyAdjust() {
    if (!this.adjustDelta || !this.adjustReason) { this.api.toast('请填写调整数量和原因', 'error'); return; }
    try {
      await firstValue(this.api.adjustInventory(this.adjustTarget.id, { delta: this.adjustDelta, reason: this.adjustReason }));
      this.api.toast('库存已调整');
      this.adjustTarget = null;
      this.tickets = await firstValue(this.api.listTickets(true)) as any[];
    } catch (e: any) { this.api.toast(e.error?.message || '失败', 'error'); }
  }
}
function firstValue(o: any) { return (o as any).pipe ? (o as any).toPromise() : Promise.resolve(o); }
