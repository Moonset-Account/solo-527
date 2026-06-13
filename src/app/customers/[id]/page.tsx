"use client";

import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import CustomerDetailPage from "@/pages/CustomerDetailPage";

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  return (
    <AppLayout>
      <CustomerDetailPage id={params.id} onBack={() => router.push("/customers")} />
    </AppLayout>
  );
}
