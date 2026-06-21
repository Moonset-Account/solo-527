import { Page, PageHeader } from "@/components/Page";
import { SettingsForm } from "@/components/SettingsForm";

export default function SettingsPage() {
  return (
    <Page>
      <PageHeader
        breadcrumb={[{ label: "系统管理" }, { label: "系统设置" }]}
        title="系统设置"
        subtitle="校区信息、员工管理、提醒规则等系统配置"
      />
      <SettingsForm />
    </Page>
  );
}
