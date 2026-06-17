import { Component, OnInit } from '@angular/core';
@Component({
  selector: 'home-page',
  template: `
    <div class="hero">
      <div class="hero-inner">
        <div class="hero-tag">
          <span class="dot"></span> 2026 · 年度科技盛会
        </div>
        <h1>全球科技创新峰会<br>Global Tech Innovation Summit</h1>
        <p class="hero-sub">汇聚全球科技领袖 · 探讨前沿技术趋势 · 共建创新生态<br>2026年9月15-17日 · 上海国际会议中心</p>
        <div class="hero-actions">
          <button mat-raised-button color="primary" class="btn-primary" routerLink="/register">
            <span class="material-icons">how_to_reg</span> 立即报名
          </button>
          <button mat-stroked-button class="btn-outline" routerLink="/status">
            <span class="material-icons">search</span> 查询报名状态
          </button>
        </div>
        <div class="hero-stats">
          <div><div class="stat-num">80+</div><div class="stat-label">重磅嘉宾</div></div>
          <div class="divider"></div>
          <div><div class="stat-num">650+</div><div class="stat-label">已报名参会者</div></div>
          <div class="divider"></div>
          <div><div class="stat-num">30+</div><div class="stat-label">主题专场</div></div>
        </div>
      </div>
      <div class="hero-bg"></div>
    </div>
    <div class="features">
      <div class="f-card">
        <span class="material-icons">lightbulb</span>
        <h3>前沿议题</h3>
        <p>AI 大模型、量子计算、自动驾驶、Web3.0、生物医药...</p>
      </div>
      <div class="f-card">
        <span class="material-icons">groups</span>
        <h3>顶级人脉</h3>
        <p>与 CEO、CTO、投资人、行业专家深度一对一交流</p>
      </div>
      <div class="f-card">
        <span class="material-icons">workspace_premium</span>
        <h3>VIP 体验</h3>
        <p>VIP 专属座位、贵宾晚宴、闭门圆桌深度研讨</p>
      </div>
    </div>
    <div class="cta-bar">
      <div>
        <div style="font-size:20px;font-weight:700;color:white">名额有限，先到先得</div>
        <div style="opacity:.8;margin-top:4px">普通票剩余 <strong>{{ left }}</strong> 张 · VIP 票售罄预警</div>
      </div>
      <button mat-raised-button style="background:white;color:#1e3a8a;font-weight:700" routerLink="/register">
        立即抢票 →
      </button>
    </div>
  `,
  styles: [`
    .hero {
      position:relative;padding:80px 24px 100px;background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#2563eb 100%);
      overflow:hidden;color:white;
    }
    .hero-bg {
      position:absolute;inset:0;background:
        radial-gradient(circle at 80% 20%, rgba(59,130,246,.3) 0, transparent 40%),
        radial-gradient(circle at 20% 80%, rgba(16,185,129,.25) 0, transparent 40%);
    }
    .hero-inner { position:relative;max-width:1200px;margin:0 auto;text-align:center; }
    .hero-tag {
      display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;
      background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);font-size:12px;
    }
    .dot { width:8px;height:8px;border-radius:50%;background:#10b981;animation:pulse 2s infinite; }
    h1 { font-size:56px;font-weight:800;margin:24px 0 16px;line-height:1.2;letter-spacing:-1px; }
    .hero-sub { font-size:18px;opacity:.9;line-height:1.8;margin:0 auto 40px;max-width:700px; }
    .hero-actions { display:flex;gap:16px;justify-content:center;margin-bottom:56px; }
    .btn-primary { height:52px;padding:0 32px;font-size:16px;font-weight:700;border-radius:12px;
      background:linear-gradient(90deg,#10b981,#059669) !important;box-shadow:0 12px 24px rgba(16,185,129,.3); }
    .btn-outline { height:52px;padding:0 28px;font-size:15px;border-radius:12px;border:2px solid rgba(255,255,255,.4) !important;color:white !important; }
    .hero-stats {
      display:flex;justify-content:center;gap:40px;padding:32px;
      background:rgba(255,255,255,.08);backdrop-filter:blur(10px);border-radius:20px;max-width:700px;margin:0 auto;
      border:1px solid rgba(255,255,255,.15);
    }
    .stat-num { font-size:40px;font-weight:800;line-height:1; }
    .stat-label { margin-top:8px;opacity:.8;font-size:13px; }
    .divider { width:1px;background:rgba(255,255,255,.2); }
    .features { max-width:1200px;margin:-40px auto 0;padding:0 24px;position:relative;
      display:grid;grid-template-columns:repeat(3,1fr);gap:20px; }
    .f-card {
      background:white;padding:32px;border-radius:20px;box-shadow:0 20px 40px rgba(0,0,0,.1);
      text-align:center;border:1px solid #e2e8f0;transition:.3s;
    }
    .f-card:hover { transform:translateY(-6px); }
    .f-card .material-icons {
      font-size:48px;background:linear-gradient(135deg,#1e3a8a,#3b82f6);
      -webkit-background-clip:text;background-clip:text;color:transparent;
    }
    .f-card h3 { font-size:20px;margin:12px 0; }
    .f-card p { color:#64748b;margin:0;line-height:1.6; }
    .cta-bar {
      max-width:1200px;margin:60px auto;padding:32px 40px;
      background:linear-gradient(90deg,#1e3a8a,#2563eb);border-radius:20px;
      display:flex;align-items:center;justify-content:space-between;
    }
  `],
})
export class HomePage {
  left = 438;
}
