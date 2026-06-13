"use client";

import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import LeadDetailPage from "@/pages/LeadDetailPage";

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  return (
    <AppLayout>
      <LeadDetailPage id={params.id} onBack={() => router.push("/leads")} />
    </AppLayout>
  );
}
