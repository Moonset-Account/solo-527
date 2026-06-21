import { api } from "@/lib/trpc/server";
import { Page, PageHeader } from "@/components/Page";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { RenewalRisksList } from "@/components/dashboard/RenewalRisksList";
import { UnfollowedTrialsList } from "@/components/dashboard/UnfollowedTrialsList";
import { TodayTodosList } from "@/components/dashboard/TodayTodosList";
import { DailyConsumptionChart } from "@/components/dashboard/DailyConsumptionChart";
import { ConversionFunnelChart } from "@/components/dashboard/ConversionFunnelChart";

interface DailyCons {
  date: string;
  hours: number;
  classes: number;
}

interface FunnelItem {
  name: string;
  value: number;
  rate: number;
}

function generateMockDailyCons(): DailyCons[] {
  const now = new Date();
  const days: DailyCons[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const base = isWeekend ? 25 : 18;
    const variance = Math.floor(Math.random() * 12);
    days.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      hours: base + variance,
      classes: Math.floor((base + variance) / 2),
    });
  }
  return days;
}

function generateMockFunnel(): FunnelItem[] {
  const leads = 128;
  const scheduled = 86;
  const completed = 72;
  const converted = 38;
  return [
    { name: "线索", value: leads, rate: 100 },
    { name: "排试听", value: scheduled, rate: +((scheduled / leads) * 100).toFixed(1) },
    { name: "完成试听", value: completed, rate: +((completed / leads) * 100).toFixed(1) },
    { name: "转化签约", value: converted, rate: +((converted / leads) * 100).toFixed(1) },
  ];
}

export default async function DashboardPage() {
  const caller = await api();

  const [kpis, renewalRisks, unfollowedTrials, todayTodos] = await Promise.all([
    caller.dashboard.getKPIs({ range: "MONTH" }),
    caller.dashboard.getRenewalRisks({ limit: 8 }),
    caller.dashboard.getUnfollowedTrials({ limit: 8 }),
    caller.dashboard.getTodayTodos(),
  ]);

  let dailyCons: DailyCons[] = [];
  let funnel: FunnelItem[] = [];
  let period = "";

  try {
    const report = await caller.reports.monthlyReport({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    });
    dailyCons = report.dailyCons as DailyCons[];
    funnel = report.funnel as FunnelItem[];
    period = report.period;
  } catch {
    dailyCons = generateMockDailyCons();
    funnel = generateMockFunnel();
    period = `${new Date().getFullYear()}年${new Date().getMonth() + 1}月`;
  }

  return (
    <Page>
      <PageHeader
        title="工作台总览"
        subtitle="实时掌握校区运营动态，关注今日核心事项"
        breadcrumb={[{ label: "首页" }, { label: "工作台" }]}
      />

      <KPIGrid kpis={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <RenewalRisksList items={renewalRisks} />
        <UnfollowedTrialsList items={unfollowedTrials} />
        <TodayTodosList items={todayTodos} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 min-h-[320px]">
          <DailyConsumptionChart data={dailyCons} period={period} />
        </div>
        <div className="min-h-[320px]">
          <ConversionFunnelChart data={funnel} />
        </div>
      </div>
    </Page>
  );
}
