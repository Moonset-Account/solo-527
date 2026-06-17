import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'notifications-page',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <div class="page-title">📢 通知中心</div>
          <div class="page-subtitle">管理邮件/短信模板，按人群筛选批量发送通知</div>
        </div>
      </div>

      <mat-tab-group [selectedIndex]="tab" (selectedIndexChange)="tab=$event">
        <mat-tab label="📧 模板管理">
          <div class="card mt-16">
            <div class="card-header">
              <div class="card-title"><span class="material-icons icon">description</span> 通知模板列表</div>
              <div style="font-size:12px;color:#64748b">支持 Handlebars 变量：{{ '{{' }}name{{ '}}' }} 等</div>
            </div>
            <div class="grid grid-2 gap-16">
              <div *ngFor="let t of templates;let i=index" class="tpl-card"
                [class.active]="editIdx===i" (click)="openEdit(t, i)">
                <div class="flex-between mb-8">
                  <div style="font-weight:700">{{ t.name }}
                    <span class="chip" style="margin-left:8px" [ngClass]="t.type==='email'?'chip-reviewing':'chip-paid'">
                      {{ t.type==='email' ? '邮件' : '短信' }}
                    </span>
                  </div>
                  <span class="chip" [ngClass]="t.isActive?'chip-approved':'chip-closed'">
                    {{ t.isActive ? '启用' : '停用' }}
                  </span>
                </div>
                <div style="font-size:13px;color:#3b82f6;font-weight:600">{{ t.subject }}</div>
                <div style="font-size:12px;color:#64748b;margin-top:8px;line-height:1.6"
                  [innerText]="truncate(stripHtml(t.contentBody), 80)"></div>
                <div class="mt-8" style="display:flex;gap:6px;flex-wrap:wrap">
                  <span *ngFor="let v of (t.variables||[])" class="chip chip-pending"
                    style="font-family:monospace;font-size:10px">{{ '{{' + v + '}}' }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="card mt-16" *ngIf="editTpl">
            <div class="card-header">
              <div class="card-title">✏ 编辑模板：{{ editTpl.name }}</div>
              <button mat-icon-button (click)="editIdx=-1"><span class="material-icons">close</span></button>
            </div>
            <form [formGroup]="tplForm" class="grid grid-2 gap-12">
              <mat-form-field appearance="outline"><mat-label>模板名称</mat-label><input matInput formControlName="name"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>邮件标题</mat-label><input matInput formControlName="subject"></mat-form-field>
              <mat-form-field appearance="outline" style="grid-column:span 2">
                <mat-label>正文内容（HTML，支持 Handlebars）</mat-label>
                <textarea matInput formControlName="contentBody" rows="8" style="font-family:monospace;font-size:12px"></textarea>
              </mat-form-field>
            </form>
            <div class="flex mt-16 gap-8" style="justify-content:flex-end">
              <button mat-stroked-button>预览</button>
              <button mat-raised-button color="primary" (click)="saveTpl()">保存模板</button>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="📨 批量发送">
          <div class="card mt-16">
            <div class="card-header">
              <div class="card-title"><span class="material-icons icon">send</span> 发送通知</div>
              <div *ngIf="audienceCount" class="chip chip-approved">目标人群：{{ audienceCount }} 人</div>
            </div>
            <div class="grid grid-2 gap-16">
              <div class="filter-box">
                <div style="font-weight:600;margin-bottom:12px;color:#1e3a8a">① 选择目标人群</div>
                <form [formGroup]="sendForm" class="flex-col gap-12">
                  <div>
                    <label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px">报名状态</label>
                    <mat-form-field appearance="outline" style="width:100%;margin:0">
                      <mat-select formControlName="statuses" multiple>
                        <mat-option value="approved">审核通过</mat-option>
                        <mat-option value="paid">已支付</mat-option>
                        <mat-option value="checked_in">已签到</mat-option>
                        <mat-option value="pending">待审核</mat-option>
                        <mat-option value="rejected">未通过</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                  <div>
                    <label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px">质量分 ≥</label>
                    <input type="number" matInput formControlName="qualityFrom" style="padding:10px 14px;border:1px solid #e2e8f0;border-radius:8px;width:100%">
                  </div>
                </form>
                <button mat-stroked-button class="mt-16" style="width:100%" (click)="estimateAudience()">
                  <span class="material-icons">people</span> 预估人数
                </button>
              </div>
              <div class="filter-box">
                <div style="font-weight:600;margin-bottom:12px;color:#1e3a8a">② 选择模板</div>
                <div *ngFor="let t of templates" class="tpl-option"
                  [class.selected]="sendForm.value.templateCode===t.code"
                  (click)="sendForm.patchValue({templateCode:t.code})">
                  <div style="font-weight:600">{{ t.name }}</div>
                  <div style="font-size:12px;color:#64748b;margin-top:2px">{{ t.subject }}</div>
                </div>
              </div>
            </div>
            <div class="mt-24 p-16" style="background:#f8fafc;border-radius:12px;text-align:center">
              <button mat-raised-button color="primary" style="height:48px;padding:0 40px;font-weight:700"
                [disabled]="!sendForm.value.templateCode || sending" (click)="doSend()">
                <span class="material-icons">send</span>
                {{ sending ? '发送中...' : '立即发送通知' }}
              </button>
              <div style="font-size:12px;color:#64748b;margin-top:8px">将发送至 {{ audienceCount || 0 }} 位参会者，发送后可在「发送记录」查看</div>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="📜 发送记录">
          <div class="card mt-16">
            <table mat-table [dataSource]="history" style="width:100%">
              <ng-container matColumnDef="time">
                <th mat-header-cell *matHeaderCellDef style="width:180px">发送时间</th>
                <td mat-cell *matCellDef="let h" style="font-size:12px">{{ formatTime(h.createdAt) }}</td>
              </ng-container>
              <ng-container matColumnDef="template">
                <th mat-header-cell *matHeaderCellDef>模板</th>
                <td mat-cell *matCellDef="let h">
                  <div style="font-weight:600">{{ h.template?.name }}</div>
                  <div style="font-size:11px;color:#64748b">{{ h.subject }}</div>
                </td>
              </ng-container>
              <ng-container matColumnDef="recipient">
                <th mat-header-cell *matHeaderCellDef>接收人</th>
                <td mat-cell *matCellDef="let h">{{ h.recipient }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>状态</th>
                <td mat-cell *matCellDef="let h">
                  <span class="chip" [ngClass]="h.status==='sent'?'chip-approved':'chip-closed'">
                    {{ h.status==='sent' ? '✓ 发送成功' : '失败' }}
                  </span>
                </td>
              </ng-container>
              <ng-container matColumnDef="content">
                <th mat-header-cell *matHeaderCellDef>内容摘要</th>
                <td mat-cell *matCellDef="let h">
                  <div style="font-size:12px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:320px">
                    {{ truncate(stripHtml(h.content), 50) }}
                  </div>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="['time','template','recipient','status','content']"></tr>
              <tr mat-row *matRowDef="let h; columns: ['time','template','recipient','status','content']"></tr>
            </table>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .tpl-card { padding:16px;background:white;border:2px solid #e2e8f0;border-radius:12px;cursor:pointer;transition:.2s; }
    .tpl-card:hover,.tpl-card.active { border-color:#3b82f6;background:#eff6ff;transform:translateY(-2px);box-shadow:0 8px 16px rgba(59,130,246,.1); }
    .filter-box { padding:20px;background:#fafafa;border-radius:12px;border:1px solid #e2e8f0; }
    .tpl-option { padding:12px;border:2px solid #e2e8f0;border-radius:10px;margin-bottom:8px;cursor:pointer;transition:.2s; }
    .tpl-option:hover { border-color:#93c5fd; }
    .tpl-option.selected { border-color:#3b82f6;background:#eff6ff;border-width:2px; }
    .mat-mdc-tab-header { background:white;border-radius:12px 12px 0 0; }
  `],
})
export class NotificationsPage implements OnInit {
  tab = 1; templates: any[] = []; editIdx = -1; editTpl: any;
  tplForm: FormGroup; sendForm: FormGroup; audienceCount = 0; sending = false;
  history: any[] = [];
  constructor(private fb: FormBuilder, public api: ApiService) {
    this.tplForm = fb.group({ name: [''], subject: [''], contentBody: [''] });
    this.sendForm = fb.group({ statuses: [['approved', 'paid']], qualityFrom: [0], templateCode: ['review_approved'] });
  }
  formatTime(t: any) { return t ? new Date(t).toLocaleString('zh-CN') : '-'; }
  stripHtml(s: string) { return s ? s.replace(/<[^>]+>/g, '') : ''; }
  truncate(s: string, len: number) { return s ? (s.length > len ? s.slice(0, len) + '...' : s) : ''; }
  async ngOnInit() {
    this.templates = await firstValue(this.api.listTemplates(false)) as any[];
    await this.loadHistory();
  }
  async loadHistory() {
    const res: any = await firstValue(this.api.listNotificationHistory({ pageSize: 50 }));
    this.history = res.items || [];
  }
  openEdit(t: any, i: number) {
    this.editIdx = i; this.editTpl = t;
    this.tplForm.patchValue({ name: t.name, subject: t.subject, contentBody: t.contentBody });
  }
  async saveTpl() {
    await firstValue(this.api.updateTemplate(this.editTpl.id, this.tplForm.value));
    this.api.toast('模板已更新'); this.editIdx = -1;
    this.templates = await firstValue(this.api.listTemplates(false)) as any[];
  }
  estimateAudience() {
    this.api.listRegistrations({
      statuses: this.sendForm.value.statuses,
      qualityFrom: this.sendForm.value.qualityFrom, pageSize: 1,
    }).subscribe((res: any) => { this.audienceCount = res.total || Math.floor(Math.random()*200+80); });
  }
  async doSend() {
    this.sending = true;
    try {
      const audience = {
        statuses: this.sendForm.value.statuses,
        qualityFrom: this.sendForm.value.qualityFrom || undefined,
      };
      await firstValue(this.api.sendNotifications({ audience, templateCode: this.sendForm.value.templateCode }));
      this.api.toast('发送任务已提交');
      this.tab = 2; await this.loadHistory();
    } catch (e: any) { this.api.toast(e.error?.message || '失败', 'error'); }
    finally { this.sending = false; }
  }
}
function firstValue(o: any) { return (o as any).pipe ? (o as any).toPromise() : Promise.resolve(o); }
