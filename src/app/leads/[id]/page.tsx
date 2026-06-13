"use client";

import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import LeadDetailPage from "@/pages/LeadDetailPage";

export default function Page() {
  const params = useParams() as { id: string } | undefined;
  const router = useRouter();
  const id = params?.id ?? "";
  if (!id) return <div>加载中...</div>;
  return (
    <AppLayout>
      <LeadDetailPage id={id} onBack={() => router.push("/leads")} />
    </AppLayout>
  );
}
