"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/components/ui/DataTable";

export default function PaginationWrapper({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const onPageChange = (p: number) => {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(p));
    router.push(`/leads?${next.toString()}`);
  };

  return <Pagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />;
}
