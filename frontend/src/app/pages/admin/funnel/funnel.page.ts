import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'funnel-page',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <div class="page-title">🔻 转化漏斗分析</div>
          <div class="page-subtitle">曝光 → 到场 全链路转化追踪，识别流失节点</div>
        </div>
      </div>

      <div class="grid grid-2 gap-24">
        <div class="card" style="grid-column:span 2">
          <div class="card-header">
            <div class="card-title"><span class="material-icons icon">waterfall_chart</span> 全链路转化漏斗</div>
            <div style="font-size:12px;color:#64748b">整体转化率：<strong style="color:#10b981">{{ overallRate }}%</strong></div>
          </div>
          <div class="funnel">
            <div *ngFor="let s of funnel;let i=index" class="f-step"
              [style.width]="(80 - i*8) + '%'"
              [style.background]="gradients[i]">
              <div class="f-left">
                <div class="f-icon">{{ icons[i] }}</div>
                <div>
                  <div class="f-label">{{ s.label }}</div>
                  <div style="font-size:11px;opacity:.8">{{ s.desc }}</div>
                </div>
              </div>
              <div class="f-right">
                <div class="f-value">{{ s.value.toLocaleString('zh-CN') }}</div>
                <div style="font-size:11px">
                  <span style="opacity:.8">环节转化</span>
                  <span style="font-weight:700;margin-left:4px">{{ s.rate }}%</span>
                  <span *ngIf="i>0 && s.rate < 70" style="color:#fecaca;margin-left:6px">⚠</span>
                </div>
                <div *ngIf="i>0" style="font-size:11px;margin-top:2px">
                  <span style="opacity:.8">累计</span>
                  <span style="font-weight:700;margin-left:4px">{{ s.overallRate }}%</span>
                </div>
              </div>
            </div>
            <div *ngFor="let s of funnel.slice(0, funnel.length-1);let i=index" class="f-drop">
              <span>⬇ 流失</span>
              <strong style="color:#ef4444;font-size:16px">
                {{ (funnel[i].value - funnel[i+1].value).toLocaleString('zh-CN') }} 人
                ({{ 100 - funnel[i+1].rate }}%)
              </strong>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title" style="margin-bottom:16px">🎯 关键洞察</div>
          <mat-list>
            <div *ngFor="let ins of insights" class="insight-item">
              <div class="insight-badge" [class.warn]="ins.level==='warn'" [class.bad]="ins.level==='bad'">
                {{ ins.level==='good' ? '✓' : ins.level==='warn' ? '!' : '✗' }}
              </div>
              <div style="flex:1">
                <div style="font-weight:600">{{ ins.title }}</div>
                <div style="font-size:12px;color:#64748b;margin-top:2px">{{ ins.desc }}</div>
              </div>
            </div>
          </mat-list>
        </div>

        <div class="card">
          <div class="card-title" style="margin-bottom:16px">💡 优化建议</div>
          <div class="grid grid-2 gap-12">
            <div class="sug-card" *ngFor="let s of suggestions">
              <div class="sug-icon">{{ s.icon }}</div>
              <div style="flex:1">
                <div style="font-weight:600;font-size:13px">{{ s.title }}</div>
                <div style="font-size:11px;color:#64748b;margin-top:4px">{{ s.desc }}</div>
                <div class="mt-8" style="display:flex;gap:6px">
                  <span class="chip" [ngClass]="s.priority==='高'?'chip-rose':s.priority==='中'?'chip-amber':'chip-approved'" style="font-size:10px">
                    {{ s.priority }}优先级
                  </span>
                  <span class="chip chip-reviewing" style="font-size:10px">预计↑{{ s.impact }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .funnel { padding: 20px 0 0; }
    .f-step {
      margin: 0 auto 6px;padding: 20px 28px;border-radius: 14px;color: white;
      display: flex;justify-content: space-between;align-items: center;transition: .3s;
      box-shadow: 0 8px 24px rgba(0,0,0,.08);clip-path: polygon(0 0,100% 0,97% 100%,3% 100%);
    }
    .f-step:hover { transform: scale(1.01); }
    .f-left { display: flex;align-items: center;gap: 16px; }
    .f-icon {
      width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,.2);
      display:flex;align-items:center;justify-content:center;font-size:24px;backdrop-filter:blur(10px);
    }
    .f-label { font-size: 17px;font-weight: 700; }
    .f-value { font-size: 32px;font-weight: 800;line-height: 1;text-align: right; }
    .f-right { text-align:right;font-size: 12px; }
    .f-drop {
      display: flex;justify-content: center;align-items: center;gap: 10px;
      padding: 6px 0;font-size: 12px;color: #64748b;
    }
    .insight-item {
      display: flex;gap: 12px;align-items: flex-start;padding: 14px 0;border-bottom: 1px solid #f1f5f9;
    }
    .insight-badge {
      width:30px;height:30px;border-radius:8px;background:#d1fae5;color:#065f46;
      display:flex;align-items:center;justify-content:center;font-weight:800;flex-shrink:0;
    }
    .insight-badge.warn { background:#fef3c7;color:#92400e; }
    .insight-badge.bad { background:#fee2e2;color:#991b1b; }
    .sug-card {
      display:flex;gap:12px;padding:14px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;
    }
    .sug-icon {
      width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#1e3a8a,#3b82f6);
      color:white;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;
    }
    .chip-amber { background:#fef3c7;color:#92400e; }
  `],
})
export class FunnelPage implements OnInit {
  funnel: any[] = []; overallRate = 0;
  gradients = [
    'linear-gradient(135deg,#1e3a8a,#3b82f6)',
    'linear-gradient(135deg,#1d4ed8,#60a5fa)',
    'linear-gradient(135deg,#0e7490,#22d3ee)',
    'linear-gradient(135deg,#047857,#34d399)',
    'linear-gradient(135deg,#065f46,#10b981)',
    'linear-gradient(135deg,#064e3b,#6ee7b7)',
  ];
  icons = ['👁', '👆', '📝', '✅', '💳', '✅'];
  insights: any[] = []; suggestions: any[] = [];
  constructor(public api: ApiService) {}
  async ngOnInit() {
    this.funnel = (await firstValue(this.api.funnelData()) as any[]) || [
      { key: 'exposure', label: '页面曝光', value: 5800, desc: '着陆页独立访客', rate: 100, overallRate: 100 },
      { key: 'click_form', label: '点击报名', value: 2100, desc: '进入报名表单', rate: 36.2, overallRate: 36.2 },
      { key: 'submitted', label: '提交报名', value: 12, desc: '成功完成表单提交', rate: 36, overallRate: 13 },
      { key: 'review_pass', label: '审核通过', value: 9, desc: '资料审核通过', rate: 75, overallRate: 9.8 },
      { key: 'paid', label: '完成支付', value: 8, desc: '含免费票', rate: 89, overallRate: 8.7 },
      { key: 'checked_in', label: '到场签到', value: 4, desc: '实际到场签到', rate: 50, overallRate: 4.35 },
    ];
    this.overallRate = this.funnel.length ? this.funnel[this.funnel.length - 1].overallRate : 0;
    this.insights = [
      { level: 'bad', title: '点击→提交 转化偏低(36%)', desc: '表单字段过多或流程复杂，用户中途放弃率高' },
      { level: 'warn', title: '支付→到场 流失严重(50%)', desc: '大量付费用户未到场，需加强提醒和确认机制' },
      { level: 'good', title: '审核通过率达 75%', desc: '报名用户整体质量较高，渠道获客精准度良好' },
      { level: 'good', title: '审核→支付转化 89%', desc: '审核通过用户付费意愿强，产品需求匹配度高' },
    ];
    this.suggestions = [
      { icon: '📝', title: '精简报名表单', desc: '移除非必填字段，分步式改为一屏式，减少放弃', priority: '高', impact: '+15% 转化' },
      { icon: '🔔', title: '到场多次触达', desc: '会前7天/3天/1天多次短信+邮件提醒确认', priority: '高', impact: '+20% 到场' },
      { icon: '💰', title: '支付后权益强化', desc: '支付成功页突出VIP价值和专属福利', priority: '中', impact: '+8% 转化' },
      { icon: '🎁', title: '到场激励机制', desc: '到场后抽奖/专属资料包/社交晚宴资格', priority: '中', impact: '+12% 到场' },
      { icon: '📱', title: '表单页体验优化', desc: '移动端布局调优，上传证件压缩', priority: '中', impact: '+10% 提交' },
      { icon: '💬', title: '人工跟进高价值用户', desc: '质量≥85分未到场用户，运营1对1跟进', priority: '低', impact: '+5% 到场' },
    ];
  }
}
function firstValue(o: any) { return (o as any).pipe ? (o as any).toPromise() : Promise.resolve(o); }
