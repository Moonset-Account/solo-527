import { A } from "@solidjs/router";

export default function Home() {
  return (
    <div style="min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; padding: 20px;">
      <div style="background: white; border-radius: 20px; padding: 48px; max-width: 900px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
        <h1 style="text-align: center; color: #1a202c; font-size: 32px; margin-bottom: 8px;">园区访客车辆临停系统</h1>
        <p style="text-align: center; color: #718096; margin-bottom: 40px; font-size: 16px;">智能、安全、高效的访客车辆管理解决方案</p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-bottom: 40px;">
          <A href="/host" style="text-decoration: none; color: inherit;">
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 16px; padding: 32px; color: white; cursor: pointer; transition: transform 0.2s; :hover { transform: translateY(-4px); }">
              <div style="font-size: 48px; margin-bottom: 16px;">👤</div>
              <h3 style="font-size: 20px; margin-bottom: 8px;">接待人</h3>
              <p style="font-size: 14px; opacity: 0.9;">创建访客预约、生成二维码、管理来访车辆</p>
            </div>
          </A>

          <A href="/guard" style="text-decoration: none; color: inherit;">
            <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 16px; padding: 32px; color: white; cursor: pointer; transition: transform 0.2s; :hover { transform: translateY(-4px); }">
              <div style="font-size: 48px; margin-bottom: 16px;">🛡️</div>
              <h3 style="font-size: 20px; margin-bottom: 8px;">保安亭</h3>
              <p style="font-size: 14px; opacity: 0.9;">扫码放行、人工核验、车辆出入管理</p>
            </div>
          </A>

          <A href="/admin" style="text-decoration: none; color: inherit;">
            <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); border-radius: 16px; padding: 32px; color: white; cursor: pointer; transition: transform 0.2s; :hover { transform: translateY(-4px); }">
              <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
              <h3 style="font-size: 20px; margin-bottom: 8px;">物业后台</h3>
              <p style="font-size: 14px; opacity: 0.9;">超时监控、黑名单管理、审计报表</p>
            </div>
          </A>
        </div>

        <div style="background: #f7fafc; border-radius: 12px; padding: 24px;">
          <h4 style="color: #2d3748; margin-bottom: 16px; font-size: 16px;">✨ 系统特性</h4>
          <ul style="color: #4a5568; font-size: 14px; line-height: 2; list-style: none; padding: 0;">
            <li style="display: flex; align-items: center; gap: 8px;"><span style="color: #48bb78;">✓</span> 访客码生成与二维码快速核验</li>
            <li style="display: flex; align-items: center; gap: 8px;"><span style="color: #48bb78;">✓</span> 车牌自动校验与黑名单拦截</li>
            <li style="display: flex; align-items: center; gap: 8px;"><span style="color: #48bb78;">✓</span> 会议取消自动失效权限</li>
            <li style="display: flex; align-items: center; gap: 8px;"><span style="color: #48bb78;">✓</span> 断网本地核验，联网自动同步</li>
            <li style="display: flex; align-items: center; gap: 8px;"><span style="color: #48bb78;">✓</span> 完整审计日志，支持责任人追溯</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
