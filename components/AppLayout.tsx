'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  '/': { title: '进度看板', subtitle: '在建项目总览、延期预警与预算概览' },
  '/delays': { title: '延期节点维护', subtitle: '处理延期节点、提醒项目经理、记录原因' },
  '/rules': { title: '提醒规则配置', subtitle: '定义延期预警、巡检提醒的触发条件与通知渠道' },
  '/rules/versions': { title: '规则版本管理', subtitle: '配置历史版本对比与一键回退' },
  '/schemes': { title: '装修方案库', subtitle: '方案模板、材料配置、施工标准维护' },
  '/inspections': { title: '巡检任务中心', subtitle: '巡检计划、执行记录与问题整改闭环' },
  '/after-sales': { title: '售后报修工单', subtitle: '客户报修处理与满意度追踪' },
  '/reports/monthly': { title: '月度复盘报表', subtitle: '延期统计、质量分析、预算偏差与绩效' },
  '/settings': { title: '个人配置中心', subtitle: '常用筛选条件固化、通知偏好设置' },
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { sidebarCollapsed } = useAppStore();

  let titleInfo = pageTitles[pathname];
  if (!titleInfo) {
    if (pathname.startsWith('/projects/')) {
      if (pathname.endsWith('/quotation')) {
        titleInfo = { title: '报价与增项管理', subtitle: '报价确认、增项审批与预算变更历史' };
      } else if (pathname.endsWith('/addons')) {
        titleInfo = { title: '增项管理', subtitle: '增项申请与客户确认' };
      } else {
        titleInfo = { title: '项目详情', subtitle: '节点进度、图纸版本、巡检记录' };
      }
    } else if (pathname.startsWith('/portal/')) {
      titleInfo = { title: '客户前台', subtitle: '查看项目进度、确认报价与增项' };
    } else {
      titleInfo = { title: '装修进度看板' };
    }
  }

  const isPortal = pathname.startsWith('/portal');

  if (isPortal) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-brand-700 text-white">
                <span className="text-xs">装</span>
              </div>
              <span className="font-serif text-sm font-semibold text-zinc-900">装修项目·客户前台</span>
            </div>
            <div className="text-sm text-zinc-500">陈先生 · 阳光花园 A-302</div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-6 animate-fade-in-up">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Sidebar />
      <div
        className={cn('transition-all duration-200', sidebarCollapsed ? 'pl-16' : 'pl-56')}
      >
        <TopBar title={titleInfo.title} subtitle={titleInfo.subtitle} />
        <main className="p-6 animate-fade-in-up">{children}</main>
      </div>
    </div>
  );
}
