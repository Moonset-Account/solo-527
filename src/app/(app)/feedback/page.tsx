import { Page, PageHeader } from "@/components/Page";
import { FeedbackList } from "@/components/FeedbackList";

export default function FeedbackPage() {
  return (
    <Page>
      <PageHeader
        breadcrumb={[{ label: "家校沟通" }, { label: "家长反馈" }]}
        title="家长反馈管理"
        subtitle="查看和回复家长反馈，及时跟进家校沟通"
      />
      <FeedbackList />
    </Page>
  );
}
