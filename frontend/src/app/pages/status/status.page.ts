import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
@Component({
  selector: 'status-page',
  template: `
    <div class="wrap" *ngIf="!registrations.length && !searched">
      <div class="header" routerLink="/" style="cursor:pointer">
        <span class="material-icons" style="color:#1e3a8a;font-size:32px">confirmation_number</span>
        <div>
          <div style="font-size:18px;font-weight:800;color:#0f172a">全球科技创新峰会</div>
          <div style="font-size:12px;color:#64748b">报名状态查询</div>
        </div>
      </div>
      <div class="query-card">
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:800">查询报名状态</h2>
        <p style="color:#64748b;margin:0 0 24px">请输入您报名时的手机号和订单编号</p>
        <form [formGroup]="form" (ngSubmit)="search()" class="flex gap-12">
          <mat-form-field appearance="outline" style="flex:2">
            <mat-label>报名手机号</mat-label>
            <input matInput formControlName="phone" required maxlength="11">
          </mat-form-field>
          <mat-form-field appearance="outline" style="flex:2">
            <mat-label>订单编号（选填）</mat-label>
            <input matInput formControlName="orderId">
          </mat-form-field>
          <button mat-raised-button color="primary" style="height:56px;padding:0 28px">
            <span class="material-icons">search</span> 查询
          </button>
        </form>
      </div>
    </div>

    <div class="wrap" *ngIf="registrations.length || searched">
      <div class="back" routerLink="/status"><span class="material-icons">arrow_back</span> 重新查询</div>
      <div class="results">
        <div *ngFor="let r of registrations" class="status-card">
          <div class="status-header">
            <div>
              <div class="order-no">订单号 <span style="font-family:monospace">{{ r.orderNo }}</span></div>
              <div class="order-date">提交于 {{ formatDate(r.createdAt) }}</div>
            </div>
            <status-badge [status]="r.status"></status-badge>
          </div>

          <div class="stepper">
            <div class="st" [class.done]="idx>=0" [class.active]="idx===0">
              <i>1</i><span>提交报名</span>
            </div>
            <div class="line" [class.done]="idx>0"></div>
            <div class="st" [class.done]="idx>=1" [class.active]="idx===1">
              <i>2</i><span>审核中</span>
            </div>
            <div class="line" [class.done]="idx>1"></div>
            <div class="st" [class.done]="idx>=2" [class.active]="idx===2">
              <i>3</i><span>{{ paidLike(r.status) ? '支付完成' : '审核通过' }}</span>
            </div>
            <div class="line" [class.done]="idx>2"></div>
            <div class="st" [class.done]="idx>=3" [class.active]="idx===3">
              <i>4</i><span>到场签到</span>
            </div>
          </div>

          <div class="info-grid">
            <div class="info"><span class="label">参会人</span>{{ r.user.name }}</div>
            <div class="info"><span class="label">手机</span>{{ r.user.phone }}</div>
            <div class="info"><span class="label">公司</span>{{ r.user.company }}</div>
            <div class="info"><span class="label">职位</span>{{ r.user.title }}</div>
            <div class="info"><span class="label">票种</span>{{ r.ticketType.name }}</div>
            <div class="info"><span class="label">金额</span><strong style="color:#be123c">¥{{ r.amount }}</strong></div>
            <div class="info"><span class="label">场次</span>{{ r.session.name }}</div>
            <div class="info"><span class="label">座位</span>{{ r.seat ? r.seat.row+'排'+r.seat.number+'座' : '不指定' }}</div>
            <div class="info" *ngIf="r.qualityScore"><span class="label">质量评分</span>
              <strong [style.color]="r.qualityScore>=80?'#059669':'#2563eb'">{{ r.qualityScore }} 分</strong>
            </div>
          </div>

          <div class="checkin-section" *ngIf="r.checkinCode">
            <div class="checkin-info">
              <div>
                <div style="font-size:14px;font-weight:700;color:#0f172a">签到码</div>
                <div style="font-size:12px;color:#64748b;margin-top:4px">入场时请出示此码，工作人员扫码核销</div>
              </div>
              <div class="status-chip" [class.used]="r.checkinCode.isUsed">
                {{ r.checkinCode.isUsed ? '✓ 已核销 · '+formatDate(r.checkinCode.usedAt) : '○ 待使用' }}
              </div>
            </div>
            <div class="qr-wrap" [routerLink]="['/checkin', r.checkinCode.code]">
              <div class="qr" [innerHTML]="r.checkinCode.qrSvg || qrPlaceholder(r.checkinCode.code)"></div>
              <div class="code">{{ r.checkinCode.code }}</div>
              <div class="hint">点击查看大图</div>
            </div>
          </div>

          <div class="review-note" *ngIf="r.reviewNote">
            <span class="material-icons">comment</span> 审核意见：{{ r.reviewNote }}
          </div>
          <div class="close-info" *ngIf="r.closeException">
            <span class="material-icons" style="color:#be123c">report</span>
            <div>
              <div><strong>异常关闭</strong> · 原因：{{ r.closeException.closeReason.name }}</div>
              <div *ngIf="r.closeException.note" style="color:#64748b;margin-top:4px">
                备注：{{ r.closeException.note }}
              </div>
            </div>
          </div>

          <div class="actions" *ngIf="showActions(r)">
            <button mat-stroked-button color="warn"
              [routerLink]="['/refund/apply', r.orderNo]">
              <span class="material-icons">money_off</span> 申请退款
            </button>
            <button mat-raised-button color="primary"
              *ngIf="r.checkinCode"
              [routerLink]="['/checkin', r.checkinCode.code]">
              <span class="material-icons">qr_code_2</span> 查看签到码
            </button>
          </div>
        </div>

        <div class="empty" *ngIf="searched && !registrations.length">
          <span class="material-icons">search_off</span>
          <div style="font-weight:600;margin-top:12px">未找到相关报名记录</div>
          <div style="color:#64748b;margin-top:4px">请核对手机号和订单号是否正确</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wrap { min-height:100vh;background:linear-gradient(180deg,#eff6ff 0%,#f8fafc 30%); }
    .header { padding:20px 32px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #e2e8f0;background:white; }
    .query-card { max-width:700px;margin:80px auto;padding:40px;background:white;border-radius:20px;box-shadow:0 10px 30px rgba(0,0,0,.06); }
    .back { padding:16px 32px;display:flex;align-items:center;gap:4px;color:#3b82f6;cursor:pointer;background:white;border-bottom:1px solid #e2e8f0; }
    .results { max-width:900px;margin:32px auto;padding:0 24px; }
    .status-card { background:white;border-radius:16px;padding:28px;margin-bottom:20px;box-shadow:0 4px 20px rgba(0,0,0,.05); }
    .status-header { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px; }
    .order-no { font-size:13px;color:#64748b; }
    .order-date { font-size:12px;color:#94a3b8;margin-top:4px; }
    .stepper {
      display:flex;align-items:center;justify-content:space-between;
      padding:24px;background:#f8fafc;border-radius:12px;margin-bottom:20px;
    }
    .st { display:flex;flex-direction:column;align-items:center;gap:8px; }
    .st i {
      width:36px;height:36px;border-radius:50%;background:#e2e8f0;color:#94a3b8;
      display:flex;align-items:center;justify-content:center;font-weight:700;font-style:normal;font-size:14px;
    }
    .st.done i { background:#10b981;color:white;content:'✓'; }
    .st.active i { background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:white;box-shadow:0 0 0 4px rgba(59,130,246,.2);animation:pulse 2s infinite; }
    .st.done i::before { content:'✓'; }
    .st.done i { font-size:0; }
    .st.done i::before { font-size:16px; }
    .st span { font-size:12px;color:#64748b; }
    .st.active span { color:#1e3a8a;font-weight:600; }
    .line { flex:1;height:2px;background:#e2e8f0;margin:0 12px;align-self:center;margin-top:-18px; }
    .line.done { background:#10b981; }
    .info-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:16px 24px;padding:16px 0; }
    .info { font-size:13px; }
    .info .label { display:block;color:#64748b;font-size:11px;margin-bottom:2px; }
    .checkin-section { margin-top:8px;padding:20px;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0; }
    .checkin-info { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px; }
    .status-chip { padding:6px 12px;border-radius:999px;background:#10b981;color:white;font-size:12px;font-weight:600; }
    .status-chip.used { background:#64748b; }
    .qr-wrap {
      background:white;border-radius:12px;padding:20px;text-align:center;cursor:pointer;
      display:inline-flex;flex-direction:column;align-items:center;gap:8px;transition:.2s;
    }
    .qr-wrap:hover { box-shadow:0 8px 20px rgba(16,185,129,.2);transform:translateY(-2px); }
    .qr svg { width:160px;height:160px; }
    .code { font-size:14px;font-weight:700;letter-spacing:2px;color:#1e3a8a;font-family:monospace; }
    .hint { font-size:11px;color:#64748b; }
    .review-note {
      margin-top:16px;padding:12px 16px;background:#eff6ff;border-radius:10px;
      color:#1e40af;display:flex;gap:8px;align-items:flex-start;font-size:13px;
    }
    .close-info {
      margin-top:16px;padding:12px 16px;background:#fef2f2;border-radius:10px;
      display:flex;gap:10px;align-items:flex-start;font-size:13px;color:#7f1d1d;
    }
    .actions { margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;gap:12px;justify-content:flex-end; }
    .empty { text-align:center;padding:60px 20px;color:#64748b;background:white;border-radius:16px; }
    .empty .material-icons { font-size:64px;color:#cbd5e1; }
  `],
})
export class StatusPage implements OnInit {
  form: FormGroup;
  registrations: any[] = [];
  searched = false;
  constructor(
    private fb: FormBuilder, private api: ApiService,
    private route: ActivatedRoute, private router: Router, public dialog: MatDialog,
    private title: Title,
  ) {
    this.form = fb.group({ phone: [''], orderId: [''] });
  }
  ngOnInit() {
    const qp = this.route.snapshot.queryParams;
    if (qp.phone) {
      this.form.patchValue({ phone: qp.phone, orderId: qp.orderId || '' });
      this.search();
    }
  }
  get idx() {
    if (!this.registrations.length) return -1;
    const s = this.registrations[0].status;
    if (['pending'].includes(s)) return 0;
    if (['reviewing'].includes(s)) return 1;
    if (['rejected', 'closed'].includes(s)) return -1;
    if (['approved', 'paid', 'refunded'].includes(s)) return 2;
    if (['checked_in'].includes(s)) return 3;
    return 0;
  }
  paidLike(s: string) { return ['paid', 'checked_in'].includes(s); }
  showActions(r: any) {
    return ['approved', 'paid', 'rejected'].includes(r.status);
  }
  qrPlaceholder(code: string) {
    const qrSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
      <rect width="160" height="160" fill="#fff"/>
      <g fill="#1e3a8a">
        ${Array.from({length:18}).map((_,r)=>Array.from({length:18}).map((_,c)=>
          (((r*7+c*5+code.length)%4===0)||((r<3&&c<3)||(r<3&&c>14)||(r>14&&c<3))||((r===8||r===9)&&(c===8||c===9)))
            ? `<rect x="${8+c*8}" y="${8+r*8}" width="7" height="7"/>`: ''
        ).join('')).join('')}
      </g>
      <text x="80" y="152" text-anchor="middle" font-size="9" fill="#1e3a8a" font-family="monospace">${code}</text>
    </svg>`;
    return qrSvg;
  }
  formatDate(d: any) { return d ? new Date(d).toLocaleString('zh-CN') : '-'; }
  async search() {
    if (!this.form.value.phone) { this.api.toast('请输入手机号', 'error'); return; }
    this.searched = true;
    try {
      const res: any = await firstValueFrom(this.api.lookupRegistrations(this.form.value.phone, this.form.value.orderId));
      this.registrations = res || [];
    } catch (e: any) {
      this.registrations = [];
    }
  }
}
