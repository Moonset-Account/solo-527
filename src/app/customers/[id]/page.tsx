"use client";

import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import CustomerDetailPage from "@/pages/CustomerDetailPage";

export default function Page() {
  const params = useParams() as { id: string } | undefined;
  const router = useRouter();
  const id = params?.id ?? "";
  if (!id) return <div>加载中...</div>;
  return (
    <AppLayout>
      <CustomerDetailPage id={id} onBack={() => router.push("/customers")} />
    </AppLayout>
  );
}
