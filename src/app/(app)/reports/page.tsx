import { Page, PageHeader } from "@/components/Page";
import { MonthlyReport } from "@/components/MonthlyReport";

export default function ReportsPage() {
  return (
    <Page>
      <PageHeader
        breadcrumb={[{ label: "数据分析" }, { label: "月度报表" }]}
        title="数据报表中心"
        subtitle="经营数据概览、续报风险分析、数据导出管理"
      />
      <MonthlyReport />
    </Page>
  );
}
