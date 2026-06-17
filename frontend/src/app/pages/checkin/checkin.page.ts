import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'checkin-page',
  template: `
    <div class="wrap" *ngIf="codeData">
      <div class="checkin-card">
        <div class="brand">
          <span class="material-icons">confirmation_number</span>
          <span>全球科技创新峰会 · 签到凭证</span>
        </div>
        <div class="who">
          <div style="font-size:24px;font-weight:800">{{ codeData.registration.user.name }}</div>
          <div style="color:#64748b;margin-top:4px">{{ codeData.registration.user.company }} · {{ codeData.registration.user.title }}</div>
        </div>
        <div class="qr-box">
          <div class="qr-glow"><div class="qr" [innerHTML]="codeData.qrSvg || placeholder"></div></div>
          <div class="code">{{ codeData.code }}</div>
          <div class="status" [class.used]="codeData.isUsed">
            {{ codeData.isUsed ? '✓ 已核销 · ' + formatDate(codeData.usedAt) + ' · ' + codeData.usedLocation : '○ 请向工作人员出示此码' }}
          </div>
        </div>
        <div class="meta">
          <div class="m"><span class="label">票种</span><strong>{{ codeData.registration.ticketType.name }}</strong></div>
          <div class="m"><span class="label">场次</span><strong>{{ codeData.registration.session.name }}</strong></div>
          <div class="m"><span class="label">订单号</span><strong style="font-family:monospace">{{ codeData.registration.orderNo }}</strong></div>
          <div class="m"><span class="label">金额</span><strong style="color:#be123c">¥{{ codeData.registration.amount }}</strong></div>
        </div>
        <div class="tip">
          <span class="material-icons">info</span>
          请于会议开始前 30 分钟到达会场，出示本页面扫码入场
        </div>
        <div class="actions">
          <button mat-raised-button color="primary"><span class="material-icons">download</span> 下载签到码</button>
          <button mat-stroked-button routerLink="/status">返回查询</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wrap { min-height:100vh;display:flex;align-items:center;justify-content:center;
      background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#2563eb 100%);padding:24px; }
    .checkin-card { background:white;border-radius:24px;padding:40px;max-width:420px;width:100%;box-shadow:0 30px 80px rgba(0,0,0,.3);position:relative; }
    .checkin-card::before {
      content:'';position:absolute;left:-20px;right:-20px;top:170px;height:28px;
      background:repeating-linear-gradient(-45deg,#0f172a 0 12px,transparent 12px 24px);opacity:.06;
    }
    .brand { display:flex;align-items:center;gap:10px;color:#1e3a8a;font-weight:700;margin-bottom:20px; }
    .who { margin-bottom:24px; }
    .qr-box { text-align:center;padding:24px;margin:0 -8px;background:linear-gradient(180deg,#f0f9ff 0%,white 100%);border-radius:16px; }
    .qr-glow { display:inline-block;padding:16px;border-radius:20px;background:radial-gradient(circle,rgba(59,130,246,.15),transparent 70%); }
    .qr svg { width:220px;height:220px;filter:drop-shadow(0 4px 12px rgba(30,58,138,.15)); }
    .code { margin-top:12px;font-size:18px;font-weight:800;letter-spacing:4px;color:#1e3a8a;font-family:monospace; }
    .status { margin-top:10px;font-size:12px;color:#059669;font-weight:600; }
    .status.used { color:#64748b; }
    .meta { margin-top:24px;display:grid;grid-template-columns:1fr 1fr;gap:12px; }
    .m { padding:12px;background:#f8fafc;border-radius:10px;font-size:13px; }
    .m .label { display:block;font-size:11px;color:#64748b;margin-bottom:2px; }
    .tip { margin-top:20px;padding:12px 16px;background:#fffbeb;border-radius:10px;display:flex;gap:8px;align-items:flex-start;font-size:12px;color:#78350f; }
    .actions { margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap; }
  `],
})
export class CheckinPage implements OnInit {
  code = ''; codeData: any = null; placeholder = '';
  constructor(private route: ActivatedRoute, private api: ApiService) {}
  async ngOnInit() {
    this.code = this.route.snapshot.params['code'];
    this.placeholder = this.genPlaceholder(this.code);
    try {
      this.codeData = await firstValueFrom(this.api.getCheckinCode(this.code));
    } catch {
      this.codeData = {
        code: this.code, isUsed: false, qrSvg: this.placeholder,
        registration: { user: { name: '加载中', company: '-', title: '-' },
          ticketType: { name: '-' }, session: { name: '-' }, orderNo: '-', amount: 0 },
      };
    }
  }
  genPlaceholder(code: string) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" width="220" height="220">
      <rect width="220" height="220" fill="#fff" rx="8"/>
      <g fill="#1e3a8a">
        ${Array.from({length:25}).map((_,r)=>Array.from({length:25}).map((_,c)=>
          (((r*7+c*5+code.length)%4===0)||((r<4&&c<4)||(r<4&&c>20)||(r>20&&c<4))||(((r>=11&&r<=13)&&(c>=11&&c<=13))))
            ? `<rect x="${10+c*8}" y="${10+r*8}" width="7" height="7" rx="1"/>`: ''
        ).join('')).join('')}
      </g>
      <text x="110" y="210" text-anchor="middle" font-size="11" fill="#1e3a8a" font-family="monospace" font-weight="700">${code}</text>
    </svg>`;
  }
  formatDate(d: any) { return d ? new Date(d).toLocaleString('zh-CN') : '-'; }
}
