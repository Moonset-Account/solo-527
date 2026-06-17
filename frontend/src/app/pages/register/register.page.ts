import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'register-page',
  template: `
    <div class="wrap">
      <div class="header" routerLink="/" style="cursor:pointer">
        <span class="material-icons" style="color:#1e3a8a;font-size:32px">confirmation_number</span>
        <div>
          <div style="font-size:18px;font-weight:800;color:#0f172a">全球科技创新峰会</div>
          <div style="font-size:12px;color:#64748b">2026.09.15-17 · 上海国际会议中心</div>
        </div>
      </div>

      <div class="form-wrap">
        <div class="form-card">
          <div class="stepper">
            <div *ngFor="let s of steps;let i=index" class="step" [class.active]="step===i" [class.done]="step>i">
              <div class="num">{{ step>i ? '✓' : i+1 }}</div>
              <div class="label">{{ s }}</div>
            </div>
          </div>
          <h2 style="font-size:24px;font-weight:800;margin:0 0 4px">{{ titles[step] }}</h2>
          <p style="color:#64748b;margin:0 0 24px">{{ subs[step] }}</p>

          <form [formGroup]="form" (ngSubmit)="step===3 && submit()" class="form-body">
            <div *ngIf="step===0">
              <mat-form-field appearance="outline" class="full">
                <mat-label>选择场次 *</mat-label>
                <mat-select formControlName="sessionId" required>
                  <mat-option *ngFor="let s of sessions" [value]="s.id">
                    {{ s.name }} · {{ formatDate(s.startTime) }} · {{ s.venue }}
                  </mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full">
                <mat-label>选择票种 *</mat-label>
                <mat-select formControlName="ticketTypeId" required>
                  <mat-option *ngFor="let t of tickets" [value]="t.id">
                    <div class="ticket-opt">
                      <div>
                        <strong style="color:#1e3a8a">{{ t.name }}</strong>
                        <span *ngIf="t.level==='vip'" class="chip chip-approved" style="margin-left:6px">VIP</span>
                        <span *ngIf="t.level==='guest'" class="chip chip-closed" style="margin-left:6px">嘉宾</span>
                        <div class="ticket-desc">{{ t.description }}</div>
                      </div>
                      <div class="ticket-right">
                        <div class="price">{{ t.price>0 ? '¥'+t.price : '免费' }}</div>
                        <div class="left">剩 {{ t.totalInventory - t.soldCount }} / {{ t.totalInventory }}</div>
                      </div>
                    </div>
                  </mat-option>
                </mat-select>
              </mat-form-field>
              <div class="seat-section" *ngIf="form.value.sessionId && seats.length">
                <div style="font-weight:600;margin-bottom:12px">选择座位（可选）</div>
                <div class="seat-map">
                  <div class="stage">主 会 场 舞 台</div>
                  <div class="seats" *ngFor="let group of seatGroups">
                    <div class="seat-row" *ngFor="let row of group.rows">
                      <div class="row-label">{{ row[0].row }}</div>
                      <div *ngFor="let s of row" class="seat"
                        [class.selected]="form.value.seatId===s.id"
                        [class.sold]="s.status==='sold'"
                        (click)="s.status==='available' && form.patchValue({seatId:s.id})">
                        {{ s.number }}
                      </div>
                    </div>
                  </div>
                  <div class="seat-legend">
                    <span><i class="available"></i>可选</span>
                    <span><i class="selected"></i>已选</span>
                    <span><i class="sold"></i>已售</span>
                  </div>
                </div>
              </div>
            </div>

            <div *ngIf="step===1">
              <div class="grid grid-2 gap-12">
                <mat-form-field appearance="outline">
                  <mat-label>姓名 *</mat-label>
                  <input matInput formControlName="name" required>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>手机号 *</mat-label>
                  <input matInput formControlName="phone" required maxlength="11">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>邮箱</mat-label>
                  <input matInput formControlName="email" type="email">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>身份证号（身份核验）</mat-label>
                  <input matInput formControlName="idCard" maxlength="18">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>公司名称 *</mat-label>
                  <input matInput formControlName="company" required>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>职位 *</mat-label>
                  <input matInput formControlName="title" required>
                </mat-form-field>
              </div>
              <mat-form-field appearance="outline" class="full mt-16">
                <mat-label>报名来源</mat-label>
                <mat-select formControlName="channelSource">
                  <mat-option value="官方网站">官方网站</mat-option>
                  <mat-option value="合作伙伴推荐">合作伙伴推荐</mat-option>
                  <mat-option value="微信推广">微信推广</mat-option>
                  <mat-option value="行业媒体">行业媒体</mat-option>
                  <mat-option value="地推活动">地推活动</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div *ngIf="step===2">
              <div style="padding:20px;background:#f1f5f9;border-radius:12px">
                <div style="font-size:13px;color:#64748b">报名信息确认</div>
                <div class="confirm-row"><span>场次</span><strong>{{ getSessionName(form.value.sessionId) }}</strong></div>
                <div class="confirm-row"><span>票种</span><strong>{{ getTicketName(form.value.ticketTypeId) }}</strong></div>
                <div class="confirm-row"><span>座位</span><strong>{{ form.value.seatId ? getSeatLabel(form.value.seatId) : '不指定' }}</strong></div>
                <div class="confirm-row"><span>姓名</span><strong>{{ form.value.name }}</strong></div>
                <div class="confirm-row"><span>手机</span><strong>{{ form.value.phone }}</strong></div>
                <div class="confirm-row"><span>公司</span><strong>{{ form.value.company }}</strong></div>
                <div class="confirm-row"><span>职位</span><strong>{{ form.value.title }}</strong></div>
                <div class="confirm-row total"><span>应付金额</span>
                  <strong style="color:#be123c;font-size:24px">¥{{ totalAmount.toFixed(2) }}</strong>
                </div>
              </div>
              <mat-checkbox class="mt-16" formControlName="agree">
                我已阅读并同意《参会条款》和《个人信息处理声明》*
              </mat-checkbox>
            </div>

            <div *ngIf="step===3 && submitted && !success" class="submitting">
              <mat-spinner diameter="48"></mat-spinner>
              <div style="margin-top:16px;font-weight:600">正在提交报名...</div>
            </div>
          </form>

          <div class="form-actions" *ngIf="step<3">
            <button mat-stroked-button *ngIf="step>0" (click)="step=step-1">上一步</button>
            <div style="flex:1"></div>
            <button *ngIf="step<2" mat-raised-button color="primary"
              [disabled]="!canNext()" (click)="step=step+1">下一步</button>
            <button *ngIf="step===2" mat-raised-button color="primary"
              [disabled]="!form.value.agree" (click)="step=3;submit()">提交报名</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wrap { min-height:100vh;background:linear-gradient(180deg,#eff6ff 0%,#f8fafc 30%); }
    .header { padding:20px 32px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #e2e8f0;background:white; }
    .form-wrap { max-width:800px;margin:40px auto;padding:0 24px; }
    .form-card { background:white;border-radius:20px;padding:32px 40px;box-shadow:0 10px 30px rgba(0,0,0,.06); }
    .stepper { display:flex;gap:0;margin-bottom:28px;position:relative; }
    .step { flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;position:relative; }
    .step:not(:last-child)::after {
      content:'';position:absolute;top:16px;left:calc(50% + 16px);right:calc(-50% + 16px);height:2px;background:#e2e8f0;z-index:0;
    }
    .step.done:not(:last-child)::after { background:#10b981; }
    .num {
      width:32px;height:32px;border-radius:50%;background:#e2e8f0;color:#64748b;
      display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;position:relative;z-index:1;
    }
    .step.active .num { background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:white;box-shadow:0 4px 12px rgba(59,130,246,.4); }
    .step.done .num { background:#10b981;color:white; }
    .label { font-size:12px;color:#64748b; }
    .step.active .label { color:#1e3a8a;font-weight:600; }
    .form-body { min-height:380px; }
    .full { width:100%;display:block; }
    .ticket-opt { display:flex;justify-content:space-between;align-items:center;padding:4px 0;width:500px; }
    .ticket-desc { font-size:11px;color:#64748b;margin-top:2px; }
    .price { font-size:18px;font-weight:800;color:#be123c; }
    .left { font-size:11px;color:#64748b;text-align:right; }
    .confirm-row {
      display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px dashed #cbd5e1;font-size:13px;
    }
    .confirm-row:last-child { border:none; }
    .confirm-row.total { padding-top:14px;margin-top:4px;border-top:2px solid #0f172a;border-bottom:none; }
    .seat-section { margin-top:18px;padding:20px;background:#f8fafc;border-radius:12px; }
    .stage {
      text-align:center;padding:14px;background:linear-gradient(90deg,#1e3a8a,#3b82f6);
      color:white;border-radius:8px;margin-bottom:24px;letter-spacing:12px;font-weight:700;
    }
    .seats { margin-bottom:16px; }
    .seat-row { display:flex;gap:6px;align-items:center;margin-bottom:6px;justify-content:center; }
    .row-label { width:32px;font-size:11px;color:#64748b; }
    .seat {
      width:28px;height:24px;border-radius:6px 6px 3px 3px;background:#dbeafe;
      display:flex;align-items:center;justify-content:center;font-size:10px;color:#1e40af;
      cursor:pointer;transition:.2s;border:1px solid #bfdbfe;
    }
    .seat:hover:not(.sold) { background:#3b82f6;color:white;transform:scale(1.1); }
    .seat.selected { background:#10b981;color:white;border-color:#059669;box-shadow:0 0 0 3px rgba(16,185,129,.2); }
    .seat.sold { background:#f1f5f9;color:#cbd5e1;cursor:not-allowed;border-color:#e2e8f0; }
    .seat-legend { display:flex;gap:20px;justify-content:center;margin-top:16px;font-size:12px;color:#64748b; }
    .seat-legend i { display:inline-block;width:16px;height:14px;border-radius:3px;margin-right:6px;vertical-align:middle; }
    .seat-legend .available { background:#dbeafe; }
    .seat-legend .selected { background:#10b981; }
    .seat-legend .sold { background:#f1f5f9;border:1px solid #e2e8f0; }
    .form-actions { display:flex;gap:12px;margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0; }
    .submitting { padding:40px 0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#1e3a8a; }
  `],
})
export class RegisterPage implements OnInit {
  step = 0;
  steps = ['选择场次票种', '填写资料', '确认信息', '完成提交'];
  titles = ['选择场次与票种', '填写报名资料', '确认报名信息', ''];
  subs = ['请选择您要参加的场次和票种', '请如实填写您的信息，用于身份核验', '请核对无误后提交', ''];
  sessions: any[] = [];
  tickets: any[] = [];
  seats: any[] = [];
  seatGroups: any[] = [];
  submitted = false;
  success = false;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router,
  ) {
    this.form = fb.group({
      sessionId: ['', Validators.required],
      ticketTypeId: ['', Validators.required],
      seatId: [null],
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^1\d{10}$/)]],
      email: ['', [Validators.email]],
      idCard: [''],
      company: ['', Validators.required],
      title: ['', Validators.required],
      channelSource: ['官方网站'],
      agree: [false],
    });
  }

  async ngOnInit() {
    const [sess, tks]: any = await Promise.all([
      firstValueFrom(this.api.listSessions()),
      firstValueFrom(this.api.listTickets()),
    ]);
    this.sessions = sess;
    this.tickets = tks;
    if (this.sessions.length) this.form.patchValue({ sessionId: this.sessions[0].id });
    this.form.get('sessionId')!.valueChanges.subscribe((id: string) => id && this.loadSeats(id));
    if (this.sessions.length) this.loadSeats(this.sessions[0].id);
  }

  async loadSeats(sessionId: string) {
    const res: any = await firstValueFrom(this.api.getSeats(sessionId));
    this.seats = res.seats || [];
    const byRow = new Map<string, any[]>();
    this.seats.forEach(s => {
      if (!byRow.has(s.row)) byRow.set(s.row, []);
      byRow.get(s.row)!.push(s);
    });
    const rows = Array.from(byRow.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([_, r]) => r);
    this.seatGroups = [{ rows }];
  }

  get totalAmount() {
    const t = this.tickets.find(x => x.id === this.form.value.ticketTypeId);
    return t ? Number(t.price) : 0;
  }
  getSessionName(id: string) { return this.sessions.find(s => s.id === id)?.name || '-'; }
  getTicketName(id: string) { return this.tickets.find(t => t.id === id)?.name || '-'; }
  getSeatLabel(id: string) { const s = this.seats.find(x => x.id === id); return s ? `${s.row}排${s.number}座${s.zone ? '('+s.zone+'区)' : ''}` : '-'; }
  formatDate(d: string) { return new Date(d).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }); }

  canNext() {
    if (this.step === 0) return this.form.value.sessionId && this.form.value.ticketTypeId;
    if (this.step === 1) return this.form.controls.name.valid && this.form.controls.phone.valid
      && this.form.controls.company.valid && this.form.controls.title.valid;
    return true;
  }

  async submit() {
    this.submitted = true;
    try {
      const v = this.form.value;
      const res: any = await firstValueFrom(this.api.createRegistration(v));
      this.router.navigate(['/register/success'], {
        queryParams: { orderId: res.orderNo, phone: v.phone, name: v.name, quality: res.qualityScore },
      });
    } catch (e: any) {
      this.step = 2;
      this.submitted = false;
      this.api.toast(e.error?.message || '提交失败', 'error');
    }
  }
}
