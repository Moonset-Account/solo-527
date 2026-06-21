import { Page, PageHeader } from "@/components/Page";
import { AuditTabs } from "@/components/AuditTabs";

export default function AuditPage() {
  return (
    <Page>
      <PageHeader
        breadcrumb={[{ label: "系统管理" }, { label: "审计中心" }]}
        title="审计中心"
        subtitle="题库版本管理、操作日志追溯、数据下载记录"
      />
      <AuditTabs />
    </Page>
  );
}
